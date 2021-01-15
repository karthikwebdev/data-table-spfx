export const searchByColumn = (rows, searchObject) => {
  let columnsToSearch = Object.keys(searchObject).filter(
    (value) => !!searchObject[value].trim()
  );
  return rows.filter((row) =>
    columnsToSearch.every((column) => {
      let regex = new RegExp(
        searchObject[column].toString().split("\\").join(""),
        "gi"
      );
      return row[column].toString().match(regex);
    })
  );
};
