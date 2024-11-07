#!/usr/bin/env python3

from dataclasses import dataclass
import uuid
import random
from concurrent.futures import ThreadPoolExecutor
import time
import requests
from pprint import pp
from sys import argv
import sqlite3


def parallel(max_workers: int, functions: list[tuple]) -> list[any]:
    """TODO: Document this function...
    """
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(func, *args, **kwargs)
                   for func, args, kwargs in functions]
        results = [future.result() for future in futures]
    return results


def flat[T](multi: list[T | list[T]]) -> list[T]:
    """Flattens a multi-dimentional list into a one-dimentional one. It'll
    result into a sorted list with all unique elements, be aware.
    """
    accumulator = []

    for item in multi:
        if not isinstance(item, list):
            accumulator.append(item)
            continue

        for sub_item in flat(item):
            accumulator.append(sub_item)

    return accumulator


@dataclass
class SimulationProps:
    """TODO: Document this class...
    """
    seed: int
    max_rounds: int
    api: str
    max_workers: int
    file: str

    # Actually inserted URL's
    max_links_insertions = 10**3 - 1
    max_links_per_group_insertions = 10
    max_groups_insertions = 10**3 - 1

    # Percentage probability of deleting records between each task
    missing_links_probability = .5
    missing_groups_probability = .5

    # API status the the GET/POST/PUT requests is meant to return
    expected_status_ok = 200
    expected_status_missing = 404


class Simulation:
    """TODO: Document this class...
    """
    props: SimulationProps
    rand: random.Random

    def __init__(self, props: SimulationProps):
        random.seed(props.seed)
        self.rand = random.Random(props.seed)
        self.props = props

    def start(self):
        """TODO: Document this method...
        """
        for round in range(self.props.max_rounds):
            conn = sqlite3.connect(self.props.file)
            curs = conn.cursor()

            curs.execute("DELETE FROM Links")
            curs.execute("DELETE FROM Groups")
            conn.commit()
            curs.close()
            conn.close()

            data = self._setup_random_data()
            sim = self._core_simulation_logic(data)

            # filter the private data used by the simulator before displaying
            for key in [key for key in data.keys() if key[0] == "_"]:
                del data[key]

            summary = {
                "seed": self.props.seed,
                "round": round + 1,
                "max_rounds": self.props.max_rounds,
                **sim,
                **data,
            }

            pp(summary)

    def _core_simulation_logic(self, data: dict):
        """TODO: Document this method...

        TODO: Simulate the URL retrieving as well for all inserted links.
        """
        simulation_timer_start = time.time()

        # insert the randomly generated URL's, everything should return be OK
        link_insertion_responses = parallel(
            self.rand.randint(1, self.props.max_workers), [
                (self._api_create_url, (url,), {})
                for url in data["_generated_links"]])
        succeed_link_insertions_num = len([
            0 for res in link_insertion_responses if res["succeed"]])
        failed_link_insertions_num = len([
            0 for res in link_insertion_responses if not res["succeed"]])

        # Reinsert some of the generated URL's, again, all should succeed
        link_reinsertion_responses = parallel(
            self.rand.randint(1, self.props.max_workers), [
                (self._api_create_url, (url,), {})
                for url in data["_reinsertion_links"]])
        succeed_link_reinsertions_num = len([
            0 for res in link_reinsertion_responses if res["succeed"]])
        failed_link_reinsertions_num = len([
            0 for res in link_reinsertion_responses if not res["succeed"]])

        # Check if the inserted entries are being reused in the reinsertion
        for resp in [resp for resp in link_reinsertion_responses
                     if resp["succeed"]]:
            short_url_id = resp["body"]["id"]

            assert short_url_id in [
                resp["body"]["id"] for resp in link_insertion_responses
                if resp["succeed"]]

        # Create new groups with a bunch of links (the slowest one)
        group_insertion_responses = parallel(
            self.rand.randint(1, self.props.max_workers), [
                (self._api_create_group, (grp["title"], grp["children"]), {})
                for grp in data["_generated_groups"]])
        succeed_group_insertions_num = len([
            0 for res in group_insertion_responses if res["succeed"]])
        failed_group_insertions_num = len([
            0 for res in group_insertion_responses if not res["succeed"]])

        # Reinsert some of those groups, which should create new unique ones
        group_reinsertion_responses = parallel(
            self.rand.randint(1, self.props.max_workers), [
                (self._api_create_group, (grp["title"], grp["children"]), {})
                for grp in data["_reinsertion_groups"]])
        succeed_group_reinsertions_num = len([
            0 for res in group_reinsertion_responses if res["succeed"]])
        failed_group_reinsertions_num = len([
            0 for res in group_reinsertion_responses if not res["succeed"]])

        # Ensure that every group reinserted is a new unique insertion
        for resp in [resp for resp in group_reinsertion_responses
                     if resp["succeed"]]:
            group_id = resp["body"]["id"]

            assert group_id not in [
                resp["body"]["id"] for resp in group_insertion_responses
                if resp["succeed"]]

        # Try to reinsert the group links to see if thei're being reused too
        group_links_reinsertion_responses = parallel(
            self.rand.randint(1, self.props.max_workers), [
                (self._api_create_url, (url,), {})
                for url in data["_reinsertion_group_links"]])
        succeed_group_links_reinsertions_num = len([
            0 for res in group_links_reinsertion_responses if res["succeed"]])
        failed_group_links_reinsertions_num = len([
            0 for res in group_links_reinsertion_responses
            if not res["succeed"]])

        # Check if the reinserted group links are being reused aswell
        for resp in [resp for resp in group_links_reinsertion_responses
                     if resp["succeed"]]:
            short_url_id = resp["body"]["id"]

            assert short_url_id in flat([
                [child["id"] for child in resp["body"]["children"]]
                for resp in group_insertion_responses
                if resp["succeed"]])

        simulation_timer_end = time.time()

        return {
            "link_insertion_responses_sample": link_insertion_responses[0:2],
            "succeed_link_reinsertions_num": succeed_link_reinsertions_num,
            "failed_link_reinsertions_num": failed_link_reinsertions_num,
            "succeed_link_insertions_num": succeed_link_insertions_num,
            "failed_link_insertions_num": failed_link_insertions_num,
            "group_insertion_responses_sample": [
                {"id": resp["body"]["id"],
                 "token": resp["body"]["token"],
                 "child_count": len(resp["body"]["children"])}
                for resp in group_insertion_responses][0:2],
            "succeed_group_insertions_num": succeed_group_insertions_num,
            "failed_group_insertions_num": failed_group_insertions_num,
            "succeed_group_reinsertions_num": succeed_group_reinsertions_num,
            "failed_group_reinsertions_num": failed_group_reinsertions_num,
            "succeed_group_links_reinsertions_num":
                succeed_group_links_reinsertions_num,
            "failed_group_links_reinsertions_num":
                failed_group_links_reinsertions_num,
            "simulation_timer": {
                "start": simulation_timer_start,
                "end": simulation_timer_end,
                "duration": simulation_timer_end - simulation_timer_start},
        }

    def _api_create_group(self, title: str, children):
        """TODO: Document this function...
        """
        try:
            resp = requests.post(f"{self.props.api}/create/group",
                                 json={"title": title, "children": children})
            body = resp.json()

            return {"succeed": True,
                    "status": resp.status_code,
                    "body": body}

        except Exception as err:
            conn = sqlite3.connect(self.props.file)
            curs = conn.cursor()

            curs.execute("""
              INSERT
                INTO __simulation_py
                  (seed, error)
                VALUES
                  (?, ?)
            """, (str(self.props.seed), err.__str__()))
            conn.commit()
            curs.close()
            conn.close()

            return {"succeed": False, "error": err}

    def _api_create_url(self, url: str):
        """TODO: Document this function...
        """
        try:
            resp = requests.post(f"{self.props.api}/create", json={"url": url})
            body = resp.json()

            assert resp.status_code == self.props.expected_status_ok
            assert "id" in body
            assert "url" in body
            assert "updatedAt" in body

            return {"succeed": True,
                    "status": resp.status_code,
                    "body": body}

        except Exception as err:
            conn = sqlite3.connect(self.props.file)
            curs = conn.cursor()

            curs.execute("""
              INSERT
                INTO __simulation_py
                  (seed, error)
                VALUES
                  (?, ?)
            """, (str(self.props.seed), err.__str__()))
            conn.commit()
            curs.close()
            conn.close()

            return {"succeed": False, "error": err}

    def _setup_random_data(self):
        """TODO: Document this method...
        """
        setup_timer_start = time.time()

        links_insertions_num = self.rand.randint(
            4, self.props.max_links_insertions)
        groups_insertions_num = self.rand.randint(
            4, self.props.max_groups_insertions)

        generated_links = [self._generate_url()
                           for _ in range(links_insertions_num)]
        generated_groups = [self._generate_group_data()
                            for _ in range(groups_insertions_num)]
        generated_group_links = flat(
            [grp["children"] for grp in generated_groups])

        reinsertion_links = generated_links[0:self.rand.randint(
            0, len(generated_links))]
        reinsertion_groups = generated_groups[0:self.rand.randint(
            0, len(generated_groups))]
        reinsertion_group_links = generated_group_links[0:self.rand.randint(
            0, len(generated_group_links))]

        self.rand.shuffle(generated_links)
        self.rand.shuffle(generated_groups)

        links_reinsertions_num = len(reinsertion_links)
        group_links_reinsertions_num = len(reinsertion_groups)
        groups_reinsertions_num = len(reinsertion_group_links)

        setup_timer_end = time.time()

        return {
            "_generated_links": generated_links,
            "_generated_groups": generated_groups,
            "_reinsertion_links": reinsertion_links,
            "_reinsertion_groups": reinsertion_groups,
            "_reinsertion_group_links": reinsertion_group_links,
            "links_insertions_num": links_insertions_num,
            "groups_insertions_num": groups_insertions_num,
            "links_reinsertions_num": links_reinsertions_num,
            "group_links_reinsertions_num": group_links_reinsertions_num,
            "groups_reinsertions_num": groups_reinsertions_num,
            "generated_links_sample": generated_links[0:2],
            "generated_groups_sample": [{"count": grp["count"]}
                                        for grp in generated_groups[0:3]],
            "generated_links_per_group_sample":
                generated_groups[0]["children"][0:2],
            "setup_timer": {"start": setup_timer_start,
                            "end": setup_timer_end,
                            "duration": setup_timer_end-setup_timer_start},
        }

    def _generate_group_data(self):
        """TODO: Document this method...
        """
        links_per_group_insertions_num = self.rand.randint(
            4, self.props.max_links_per_group_insertions)
        generated_links_per_group = [
            self._generate_url(prefix="group/")
            for _ in range(links_per_group_insertions_num)]

        title = f"{uuid.UUID(int=self.rand.getrandbits(128))}"
        children = generated_links_per_group
        count = links_per_group_insertions_num

        return {"title": title, "children": children, "count": count}

    def _generate_url(self, prefix=""):
        """TODO: Document this method...
        """
        id = uuid.UUID(int=self.rand.getrandbits(128))

        return f"https://example.com/{prefix}{id}"


if __name__ == "__main__":
    seed = int("0" + "".join(argv[1:])) or random.randint(0, 2**64 - 1)
    file = "local.db"
    conn = sqlite3.connect(file)
    curs = conn.cursor()

    # TODO: Reconsider if it was a good idea to use another SQLite database to
    # store the simulation error logs.

    # Create a error log table to register this simulation logs
    curs.execute("""
      CREATE TABLE IF NOT EXISTS __simulation_py (
        seed       TEXT,
        error      TEXT,
        createdAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    """)
    conn.commit()
    curs.close()
    conn.close()

    sim = Simulation(SimulationProps(
        seed=seed,
        max_rounds=10,
        max_workers=12,
        api="http://localhost:3000/api/v1",
        file=file,
    ))

    sim.start()
