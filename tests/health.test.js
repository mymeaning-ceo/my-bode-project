const request = require("supertest");
const app = require("../server"); // server.js에서 app 내보내기 필요

describe("GET /stock", () => {
  it("should return 302 redirect", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(302);
  });
});
