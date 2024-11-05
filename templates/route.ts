import { db } from "@/db";
import { routeHandler } from "@/utils/api";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { NextRequest } from "next/server";
import { z } from "zod";

const postParamsValidator = z.object({}).optional();
const postSearchValidator = z.object({}).optional();
const postBodyValidator = z.object({}).optional();

type PostParams = z.infer<typeof postParamsValidator>;
type PostSearch = z.infer<typeof postSearchValidator>;
type PostBody = z.infer<typeof postBodyValidator>;

async function POST(request: NextRequest, { params }: { params: Promise<PostParams> }) {
  return await routeHandler("POST /api/v1/user", async () => {
    return await executePost(request, db, {
      params: postParamsValidator.parse(await params),
      search: postSearchValidator.parse(request.nextUrl.searchParams),
      body: postBodyValidator.parse(await request.json()),
    });
  });
}

/**
 * TODO: Add a short paragrah to describe what this route does.
 */
async function executePost(request: NextRequest, db: LibSQLDatabase, props: {
  params: PostParams;
  search: PostSearch;
  body: PostBody;
}) {
  return { request, db, props };
}

// ************************************************************************* //

// const getParamsValidator = z.object({}).optional();
// const getSearchValidator = z.object({}).optional();

// type GetParams = z.infer<typeof getParamsValidator>;
// type GetSearch = z.infer<typeof getSearchValidator>;

// async function GET(request: NextRequest, { params }: { params: Promise<GetParams> }) {
//   return await routeHandler("GET /api/v1/user", async () => {
//     return await executeGet(request, db, {
//       params: getParamsValidator.parse(await params),
//       search: getSearchValidator.parse(request.nextUrl.searchParams),
//     });
//   });
// }

// /**
//  * TODO: Add a short paragrah to describe what this route does.
//  */
// async function executeGet(request: NextRequest, db: LibSQLDatabase, props: {
//   params: GetParams;
//   search: GetSearch;
// }) {
//   return { request, db, props };
// }

// ************************************************************************* //

// const putParamsValidator = z.object({}).optional();
// const putSearchValidator = z.object({}).optional();
// const putBodyValidator = z.object({}).optional();

// type PutParams = z.infer<typeof putParamsValidator>;
// type PutSearch = z.infer<typeof putSearchValidator>;
// type PutBody = z.infer<typeof putBodyValidator>;

// async function PUT(request: NextRequest, { params }: { params: Promise<PutParams> }) {
//   return await routeHandler("PUT /api/v1/user", async () => {
//     return await executePut(request, db, {
//       params: putParamsValidator.parse(await params),
//       search: putSearchValidator.parse(request.nextUrl.searchParams),
//       body: putBodyValidator.parse(await request.json()),
//     });
//   });
// }

// /**
//  * TODO: Add a short paragrah to describe what this route does.
//  */
// async function executePut(request: NextRequest, db: LibSQLDatabase, props: {
//   params: PutParams;
//   search: PutSearch;
//   body: PutBody;
// }) {
//   return { request, db, props };
// }

// ************************************************************************* //

// const deleteParamsValidator = z.object({}).optional();
// const deleteSearchValidator = z.object({}).optional();
// const deleteBodyValidator = z.object({}).optional();

// type DeleteParams = z.infer<typeof deleteParamsValidator>;
// type DeleteSearch = z.infer<typeof deleteSearchValidator>;
// type DeleteBody = z.infer<typeof deleteBodyValidator>;

// async function DELETE(request: NextRequest, { params }: { params: Promise<DeleteParams> }) {
//   return await routeHandler("DELETE /api/v1/user", async () => {
//     return await executeDelete(request, db, {
//       params: deleteParamsValidator.parse(await params),
//       search: deleteSearchValidator.parse(request.nextUrl.searchParams),
//       body: deleteBodyValidator.parse(await request.json()),
//     });
//   });
// }

// /**
//  * TODO: Add a short paragrah to describe what this route does.
//  */
// async function executeDelete(request: NextRequest, db: LibSQLDatabase, props: {
//   params: DeleteParams;
//   search: DeleteSearch;
//   body: DeleteBody;
// }) {
//   return { request, db, props };
// }

export {
  postParamsValidator,
  postSearchValidator,
  postBodyValidator,
  type PostParams,
  type PostSearch,
  type PostBody,
  POST,
  executePost,
  // getParamsValidator,
  // getSearchValidator,
  // type GetParams,
  // type GetSearch,
  // GET,
  // executeGet,
  // putParamsValidator,
  // putSearchValidator,
  // putBodyValidator,
  // type PutParams,
  // type PutSearch,
  // type PutBody,
  // PUT,
  // executePut,
  // deleteParamsValidator,
  // deleteSearchValidator,
  // deleteBodyValidator,
  // type DeleteParams,
  // type DeleteSearch,
  // type DeleteBody,
  // DELETE,
  // executeDelete,
};

