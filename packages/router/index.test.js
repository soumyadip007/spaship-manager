const axios = require("axios");
const pathProxy = require("./index");
const fs = require("fs");
const vol = require("memfs").vol;

jest.mock("fs");

describe("router", () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({
      "/var/www/spaship/foo/spaship.yaml": "name: Foo\npath: /foo\nref: v1.0.1\nsingle: true\ndeploykey: sehvgqrnyre",
      "/var/www/spaship/foo/index.html": "I AM FOO",
      "/var/www/spaship/ROOTSPA/spaship.yaml":
        "name: Root Spa\npath: /\nref: v1.0.1\nsingle: true\ndeploykey: dc34ldv3sd",
      "/var/www/spaship/ROOTSPA/index.html": "I AM ROOTSPA",
    });
  });

  // Testing basic HTTP responses for these URL and message combos.  Doesn't test for any particular response, just that
  // it responds.  Should add a bunch of these.
  [
    { msg: "should respond to requests", url: "http://localhost:8086/foo/" },
    { msg: "should respond to requests with duplicate slash", url: "http://localhost:8086//foo/" },
    { msg: "should respond to root path spa request", url: "http://localhost:8086/" },
  ].forEach((target) => {
    test(target.msg, async () => {
      await pathProxy.start();
      let response;
      try {
        response = await axios.get(target.url);
      } catch (e) {
        // errors are fine; this test is only looking for a response
        response = e.response;
      }
      expect(response.status).toBeGreaterThan(1);
      expect(response.status).toBeLessThan(599);
      await pathProxy.stop();
    });
  });
});
