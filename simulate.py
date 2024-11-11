#!/usr/bin/env python3

from argparse import Namespace, ArgumentParser
import random
from sys import argv
from pprint import pp
import dataclasses as dc
import sqlite3 as sql
import os
import json
from datetime import datetime
import uuid
import collections.abc as c
import time
from concurrent.futures import ThreadPoolExecutor
import requests as req
import typing as t
from pygments import highlight
from pygments.formatters.terminal256 import TerminalTrueColorFormatter
from pygments.lexers.web import JsonLexer

MAX_INT = 2**32 - 1
MIN_INT = 16
ID_ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-"
ID_LEN = 8

T = t.TypeVar("T")


def timer(name: str) -> c.Callable:
    """Decorator to mesure time of an simulation task function (if -> dict)."""
    def decorator(function: c.Callable) -> c.Callable:
        def wrapper(*args):
            start = time.time()
            ret = function(*args)
            end = time.time()

            return {**ret, name: end - start}
        return wrapper
    return decorator


def flat(multi: list[t.Any | list[T]]) -> list[t.Any | T]:
    """Flattens a multi-dimentional list into one-dimentional."""
    accumulator = []

    for item in multi:
        if not isinstance(item, list):
            accumulator.append(item)
            continue

        for sub_item in flat(item):
            accumulator.append(sub_item)

    return accumulator


def parallel(functions: list[tuple[c.Callable, tuple[any], dict]],
             max_workers=os.cpu_count()) -> list[any]:
    """Executes a list of functions in parallel threads."""
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(func, *args, **kwargs)
                   for func, args, kwargs in functions]
        results = [future.result() for future in futures]
    return results


class Types:
    @dc.dataclass
    class Group:
        title: str
        children: list[str]
        child_count: int

    @dc.dataclass
    class Resp:
        status: int
        body: dict


@dc.dataclass
class SimulatorProps:
    seed: int
    rounds: int
    workers: int
    api: str
    log_file: str
    db_file: str
    conn: sql.Connection
    curs: sql.Cursor
    max_url_insertions: int = 10_000
    max_noninserted_ids: int = 100
    max_urls_per_group_insertions: int = 100  # My app is slow for now...
    max_groups_insertions: int = 100
    max_noninserted_groups: int = 100


# NOTE: Since the Simulator class has a lot of methods, they're separated into
# different small classes that will inherit the methods/attributes from the
# previous one.

# NOTE: This tree goes from the BaseSimulator -> TreeSimulator_* -> Simulator.
# Be aware of that, each class in that tree can access the data defined in the
# previous ones upper in the tree!

class BaseSimulator:
    """Simulator attributes and util functions for the real simulator."""

    @dc.dataclass
    class Global:
        """Global data for the Simulator object, that every method can use."""
        urls: list[str] = dc.field(default_factory=list)
        reins_urls: list[str] = dc.field(default_factory=list)  # reinsertion
        groups: list[Types.Group] = dc.field(default_factory=list)
        group_urls: list[str] = dc.field(default_factory=list)
        reins_groups: list[Types.Group] = dc.field(default_factory=list)
        url_ins_resps: list[Types.Resp] = dc.field(default_factory=list)
        group_ins_resps: list[Types.Resp] = dc.field(default_factory=list)
        group_reins_resps: list[Types.Resp] = dc.field(default_factory=list)
        nonins_url_ids: list[str] = dc.field(default_factory=list)

    props: SimulatorProps
    _rand: random.Random
    _curr_round: int
    _global: Global

    # Utility methods for the Simulator object class

    def _uuid(self) -> str:
        return uuid.UUID(int=self._rand.getrandbits(128)).__str__()

    def _gen_url(self, prefix="") -> str:
        return f"https://example.com/{prefix + "/"}{self._uuid()}"

    def _nanoid(self) -> str:
        return "".join(self._rand.choices(ID_ALPHA, k=ID_LEN))


class TreeSimulator_GenerationMethods(BaseSimulator):
    """Methods for the Simulator class to create the global random data."""

    def _gen_random_insertion_and_reinsertion_urls(self) -> dict:
        """Store the generated data in _global and return a info log dict."""
        ammount = self._rand.randint(MIN_INT, self.props.max_url_insertions)
        reins_ammount = self._rand.randint(MIN_INT, ammount)

        urls = [self._gen_url() for _ in range(ammount)]
        reins_urls = urls[:reins_ammount]

        self._rand.shuffle(urls)

        self._global.urls = urls
        self._global.reins_urls = reins_urls

        return {"insertion_urls": ammount,
                "reinsertion_urls": reins_ammount,
                "urls_sample": urls[:2]}

    def _gen_random_noninserted_url_ids(self) -> dict:
        """Generate random Nano ID's to check the 404 status response error."""
        ammount = self._rand.randint(MIN_INT, self.props.max_noninserted_ids)
        ids = [self._nanoid() for _ in range(ammount)]

        self._global.nonins_url_ids = ids

        return {"noninserted_ids": ammount}

    def _gen_random_insertion_and_reinsertion_group_urls(self) -> dict:
        """Generate lots of groups and urls per group. Returns a dict log."""
        ammount = self._rand.randint(MIN_INT, self.props.max_groups_insertions)
        reins_ammount = self._rand.randint(MIN_INT, ammount)

        groups: list[Types.Group] = []

        for _ in range(ammount):
            children_ammount = self._rand.randint(
                MIN_INT, self.props.max_urls_per_group_insertions)
            children = [self._gen_url(prefix="group")
                        for _ in range(children_ammount)]

            groups.append(Types.Group(
                title=self._uuid(),
                child_count=children_ammount,
                children=children))

        reins_groups = groups[:reins_ammount]
        group_urls = flat([group.children for group in groups])

        self._rand.shuffle(groups)

        self._global.groups = groups
        self._global.group_urls = group_urls
        self._global.reins_groups = reins_groups

        return {"insertion_groups": ammount,
                "reinsertion_groups": reins_ammount,
                "group_children_sample": group_urls[:2],
                # The user doesn't need to see all childs to sample
                "groups_sample": [
                    {"title": group.title, "child_count": group.child_count}
                    for group in groups][:2]}


class TreeSimulator_ApiMethods(TreeSimulator_GenerationMethods):
    """Methods for the Simulator class to just call the API routes."""

    def _api_shorten_url(self, url: str) -> Types.Resp:
        route = "/create"
        resp = req.post(f"{self.props.api}{route}", json={"url": url})
        body = resp.json()

        assert resp.status_code in [200, 201], \
            f"Failed request, unexpected {resp.status_code} status"

        for key in ["id", "url", "updatedAt"]:
            assert key in body, f"'{key}' key not present in response body"

        return Types.Resp(status=resp.status_code, body=body)

    def _api_retrieve_shorten_url_by_id(self, url_id: str) -> Types.Resp:
        route = "/"
        resp = req.get(f"{self.props.api}{route}/{url_id}")
        body = resp.json()

        assert resp.status_code in [200, 404], \
            f"Failed request, unexpected {resp.status_code} status"

        # Check the keys only if the status is success
        if resp.status_code in [200]:
            for key in ["id", "url", "updatedAt"]:
                assert key in body, f"'{key}' key not present in response body"

        return Types.Resp(status=resp.status_code, body=body)

    def _api_create_group(self, title: str, children: list[str]) -> Types.Resp:
        route = "/create/group"
        resp = req.post(f"{self.props.api}{route}",
                        json={"title": title, "children": children})
        body = resp.json()

        assert resp.status_code in [200, 201], \
            f"Failed request, unexpected {resp.status_code} status"

        for key in ["id", "token", "title", "children"]:
            assert key in body, f"'{key}' key not present in response body"

        assert len(body["children"]) > 1, "Group created without enough childs"

        return Types.Resp(status=resp.status_code, body=body)

    def _api_retrieve_group_by_id(self, group_id: str) -> Types.Resp:
        route = "/group"
        resp = req.get(f"{self.props.api}{route}/{group_id}")
        body = resp.json()

        assert resp.status_code in [200, 404], \
            f"Failed request, unexpected {resp.status_code} status"

        # Check the keys only if the status is success
        if resp.status_code in [200]:
            for key in ["id", "title", "children", "updatedAt"]:
                assert key in body, f"'{key}' key not present in response body"

        assert "token" not in body, "Private token shouldn't be accessable."

        return Types.Resp(status=resp.status_code, body=body)


class TreeSimulator_ApplicationMethods(TreeSimulator_ApiMethods):
    """Methods that will send/read the genrated data to the application."""

    @timer("$urls_insertion")
    def _insert_urls(self) -> dict:
        """Use parallel threads to insert the URL's onto the app's database."""
        resps: list[Types.Resp] = parallel([
            (self._api_shorten_url, (url,), {})
            for url in self._global.urls], max_workers=self.props.workers)

        self._global.url_ins_resps = resps

        # TODO: Consider adding a response validation check and catalog what
        # request succeed and what failed based on the response status code.

        return {"inserted_urls": len(resps),
                "inserted_url_response_sample":
                    [resp.body for resp in resps][0]}

    @timer("$urls_reinsertion")
    def _reinsert_urls(self) -> dict:
        """Uses multi threads to reinsert some of the inserted URL's again."""
        resps: list[Types.Resp] = parallel([
            (self._api_shorten_url, (url,), {})
            for url in self._global.reins_urls],
            max_workers=self.props.workers)

        return {"reinserted_urls": len(resps),
                "reinserted_url_response_sample":
                    [resp.body for resp in resps][0]}

    @timer("$retrieve_inserted_urls")
    def _retrieve_inserted_urls(self) -> dict:
        """Try to retrieve all the inserted URL's to check if it's working."""
        ids = [resp.body["id"] for resp in self._global.url_ins_resps
               if set(resp.body) == set(["id", "url", "updatedAt"])]

        resps: list[Types.Resp] = parallel([
            (self._api_retrieve_shorten_url_by_id, (id,), {})
            for id in ids], max_workers=self.props.workers)

        for id in [resp.body["id"] for resp in resps]:
            assert id in ids, "Unexpected: Retrieved a non inserted URL"

        return {"retrieved_urls": len(resps)}

    @timer("$retrieve_noninserted_urls")
    def _retrieve_noninserted_urls(self) -> dict:
        """Use the created ID's to check if it returns 404 responses."""
        resps: list[Types.Resp] = parallel([
            (self._api_retrieve_shorten_url_by_id, (id,), {})
            for id in self._global.nonins_url_ids
        ], max_workers=self.props.workers)

        status_set = list(set([resp.status for resp in resps]))

        return {"noninserted_urls_status_set": status_set}

    @timer("$groups_insertion")
    def _insert_groups(self) -> dict:
        """Insert the generated groups using multi threads."""
        resps: list[Types.Resp] = parallel([
            (self._api_create_group, (group.title, group.children), {})
            for group in self._global.groups], max_workers=self.props.workers)

        self._global.group_ins_resps = resps

        return {"created_groups": len(resps),
                "insertion_group_response_sample":
                    [{"title": resp.body["title"],
                      "token": resp.body["token"],
                      "updated_at": resp.body["updatedAt"],
                      "child_count": len(resp.body["children"])}
                     for resp in resps][0]}

    @timer("$groups_reinsertion")
    def _reinsert_groups(self) -> dict:
        """Reinsert groups, expect to create new ones with new group ID's."""
        resps: list[Types.Resp] = parallel([
            (self._api_create_group, (group.title, group.children), {})
            for group in self._global.reins_groups],
            max_workers=self.props.workers)

        ids = [resp.body["id"] for resp in self._global.group_ins_resps]
        reins_ids = [resp.body["id"] for resp in resps]

        for id in reins_ids:
            assert id not in ids, f"Group id {id} was reused"

        self._global.group_reins_resps = resps

        return {"reinserted_groups": len(resps),
                "reinserted_gorup_response_sample":
                    [{"title": resp.body["title"],
                      "token": resp.body["token"],
                      "updated_at": resp.body["updatedAt"],
                      "child_count": len(resp.body["children"])}
                     for resp in resps][0]}

    @timer("$retrieve_inserted_groups")
    def _retrieve_inserted_groups(self) -> dict:
        """Retrive the groups by ID, expect to not be in the reins. list."""
        ids = [resp.body["id"] for resp in self._global.group_ins_resps
               if set(resp.body) == set(["id", "token", "title", "children"])]

        resps: list[Types.Resp] = parallel([
            (self._api_retrieve_group_by_id, (id,), {}) for id in ids],
            max_workers=self.props.workers)

        reins_ids = [
            resp.body["id"] for resp in self._global.group_reins_resps
            if set(resp.body) == set(["id", "token", "title", "children"])]

        for id in [resp.body["id"] for resp in resps]:
            assert id in ids, "Unexpected: Retrieved a non inserted URL"
            assert id not in reins_ids, \
                f"Unexpected: '{id}' group shoul not be present in the"\
                "reinserted groups collection"

        return {"retrieved_groups": len(resps)}

    @timer("$retrieve_noninserted_groups")
    def _retrieve_noninserted_groups(self) -> dict:
        """use the created ID's to check if the groups also reponds 404 err."""
        resps: list[Types.Resp] = parallel([
            (self._api_retrieve_group_by_id, (id,), {})
            for id in self._global.nonins_url_ids
        ], max_workers=self.props.workers)

        status_set = list(set([resp.status for resp in resps]))

        return {"noninserted_groups_status_set": status_set}


class Simulator(TreeSimulator_ApplicationMethods):
    def __init__(self, props):
        super()

        self._global = self.Global()
        self._rand = random.Random(props.seed)
        self.props = props

    def start(self) -> None:
        """For each round, execute the task and track the dict results."""
        for round in range(self.props.rounds):
            self._curr_round = round

            self._execute_pre_round()

            try:
                data = {
                    **self._gen_random_insertion_and_reinsertion_urls(),
                    **self._gen_random_insertion_and_reinsertion_group_urls(),
                    **self._gen_random_noninserted_url_ids()}
                results = {**self._insert_urls(),
                           **self._reinsert_urls(),
                           **self._retrieve_inserted_urls(),
                           **self._retrieve_noninserted_urls(),
                           **self._insert_groups(),
                           **self._reinsert_groups(),
                           **self._retrieve_inserted_groups(),
                           **self._retrieve_noninserted_groups()}

                info = {"seed": self.props.seed,
                        "rounds": self.props.rounds,
                        "current": self._curr_round,
                        "workers": self.props.workers,
                        "data": data,
                        "results": results}

                info_json = json.dumps(info, indent=2)
                colored_info = highlight(
                    info_json, lexer=JsonLexer(),
                    formatter=TerminalTrueColorFormatter())

                print(colored_info)
                print("~"*100, "\n")

            except Exception as err:
                self._execute_on_round_error(err)

    def _execute_pre_round(self) -> None:
        """Cleans the database and other files to start each simulation."""
        self.props.curs.execute("DELETE FROM Links")
        self.props.curs.execute("DELETE FROM Groups")
        self.props.conn.commit()

    def _execute_on_round_error(self, err: Exception) -> None:
        """Log the error in red and write it in JSON onto the log file."""
        data = {"seed": self.props.seed,
                "error": err.__str__(),
                "created_at": datetime.now().isoformat()}

        print("\033[31m")
        pp(data)
        print("\033[m")

        with open(self.props.log_file, "a+") as log_file:
            data_json = json.dumps(data, indent=2)

            log_file.write(data_json)

        raise err


def parse_args(args: list[str]) -> Namespace:
    parser = ArgumentParser(prog="simulate.py")

    parser.add_argument(
        "seed", nargs="?", type=int, default=random.randint(MIN_INT, MAX_INT))
    parser.add_argument("--infinite", "-i", action="store_true")

    parser.add_argument("--rounds", "-r", type=int, default=10)
    parser.add_argument("--workers", "-w", type=int,
                        default=os.cpu_count(), help="Parallel proccesses")
    parser.add_argument(
        "--api", type=str, default="http://localhost:3000/api/v1")
    parser.add_argument("--log", type=str, default="simulation.log")
    parser.add_argument(
        "--db", type=str, default="local.db", help="Sqlite file")

    return parser.parse_args(args)


def main() -> None:
    assert MIN_INT > 0, "Atempting to use 0 for the generation mechanisms"
    assert MAX_INT > 0, "Atempting to use 0 for the generation mechanisms"
    assert MAX_INT > MIN_INT, "MAX_INT should allways be bigger than MIN_INT"

    args = parse_args(argv[1:])
    seed = int(args.seed)

    while True:
        conn = sql.connect(args.db)
        curs = conn.cursor()
        simulator = Simulator(SimulatorProps(
            seed=seed,
            rounds=args.rounds,
            workers=args.workers,
            api=args.api,
            log_file=args.log,
            db_file=args.db,
            conn=conn,
            curs=curs))

        simulator.start()

        if not args.infinite:
            break

        seed = random.randint(MIN_INT, MAX_INT)

    curs.close()
    conn.close()


if __name__ == "__main__":
    main()
