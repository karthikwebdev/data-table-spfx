const {
  uniqueNamesGenerator,
  colors,
  names,
  countries,
  adjectives,
} = require("unique-names-generator");

const generateRandomName = () => {
  const config = {
    dictionaries: [names, names, colors, names, names],
    length: 2,
    separator: " ",
  };
  return uniqueNamesGenerator(config);
};

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const generateRandomCountry = () => {
  const config = {
    dictionaries: [countries],
  };
  return uniqueNamesGenerator(config);
};

const selectRandomFromArray = (arr) => {
  let randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};

const generateRandomId = () => {
  return (
    "ORD" +
    (Math.floor(Math.random() * 90) + 9) +
    "-" +
    Math.floor(Math.random() * 500)
  );
};

const randomAddressGenerator = () => {
  const customConfig = {
    dictionaries: [
      [
        "3nd Street,",
        "4nd Street,",
        `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Semper eget duis at tellus at urna condimentum. At erat pellentesque adipiscing commodo elit at imperdiet dui accumsan. Feugiat in ante metus dictum. Pharetra massa massa ultricies mi. Blandit libero volutpat sed cras. Sagittis vitae et leo duis ut. Posuere urna nec tincidunt praesent semper. Ac turpis egestas maecenas pharetra convallis. Tempor commodo ullamcorper a lacus vestibulum sed. Enim sit amet venenatis urna cursus eget nunc scelerisque. Maecenas ultricies mi eget mauris pharetra et ultrices. Sed arcu non odio euismod lacinia at quis risus.

e sollicitudin nibh sit amet commodo nulla facilisi. Risus ultricies tristique nulla aliquet enim tortor. Fermentum iaculis eu non diam phasellus vestibulum lorem. Sed id semper risus in. Egestas pretium aenean pharetra magna ac placerat vestibulum. Est ullamcorper eget nulla facilisi etiam dignissim. Feugiat sed lectus vestibulum mattis ullamcorper velit sed. Lacus sed viverra tellus in hac habitasse platea dictumst vestibulum. Sed lectus vestibulum mattis ullamcorper velit sed ullamcorper morbi tincidunt. Ac turpis egestas integer eget aliquet nibh praesent tristique magna. Elementum curabitur vitae nunc sed velit. Risus sed vulputate odio ut enim blandit volutpat maecenas volutpat. Nunc congue nisi vitae suscipit tellus mauris a diam. Sit amet tellus cras adipiscing enim eu turpis.`,

        "5nd Street,",
        "6nd Street,",
        "7nd Street,",
        "last Street,",
        "Down Town,",
        "Near Starbucks,",
        "Near Church,",
        "5th street,",
        "9th Street,",
        "#2,",
        "#1-3,",
        "#3-56,",
        "#2222,",
        "#456,",
        "#672,",
        "#456,",
        "#gt225,",
        "#78,",
      ],
      adjectives,
      names,
    ],
    separator: " ",
    length: 3,
  };
  return uniqueNamesGenerator(customConfig);
};

const selectRandomDate = () => {
  return (
    selectRandomFromArray([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]) +
    " " +
    (Math.floor(Math.random() * 29) + 1) +
    " 2020"
  );
};

const fakeJsonGenerator = (numberOfRows) => {
  let finalDataArr = [];
  for (let i = 0; i < numberOfRows; i++) {
    finalDataArr.push({
      orderId: generateRandomId(),
      name: generateRandomName(),
      amount: randomIntFromInterval(200, 400),
      date: selectRandomDate(),
      address: randomAddressGenerator(),
      country: generateRandomCountry(),
      status: selectRandomFromArray([
        "Pending",
        "Success",
        "Cancelled",
        "Info",
        "Danger",
      ]),
      type: selectRandomFromArray(["Online", "Retail", "Direct"]),
    });
  }
  return finalDataArr;
};

module.exports = fakeJsonGenerator;
