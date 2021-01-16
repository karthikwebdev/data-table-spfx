const makeNestedObject = (headers, index, rows) => {
  let selectedHeader = headers[index];
  if (selectedHeader) {
    let objectToReturn = {};
    rows.forEach((row) => {
      if (!objectToReturn[row[selectedHeader]]) {
        objectToReturn[row[selectedHeader]] = [];
      }
      objectToReturn[row[selectedHeader]].push(row);
    });
    let finalObject = {};
    Object.keys(objectToReturn).forEach((key) => {
      finalObject[key] = makeNestedObject(
        headers,
        index + 1,
        objectToReturn[key].map((obj) => ({
          ...obj,
          [selectedHeader]: undefined,
        }))
      );
    });
    const ordered = Object.keys(finalObject)
      .sort()
      .reduce((obj, key) => {
        obj[key] = finalObject[key];
        return obj;
      }, {});
    return ordered;
  } else {
    return rows;
  }
};

module.exports = makeNestedObject;
