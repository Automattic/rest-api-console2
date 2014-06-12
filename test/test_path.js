var assert = require("assert"),
  Path = require("../lib/path").Path;


describe('Path', function() {

  it('should parse segments', function() {

    var p = "/path/to/$variable/between/$variable2/done",
        path = new Path(p);

    assert.equal(5, path.parts.length);
    assert.equal(p, path.toString());
    assert.equal("/path/to/test/between/test2/done", path.toString({'$variable':'test','$variable2':'test2'}));

  });

});