const numbers = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
];
const suites = ["♣", "♠", "♦", "♥"];
const cards = [];

for (const suite of suites) {
    for (const number of numbers) {
        cards.push(`${number}${suite}`);
    }
}

function shuffleArray(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}
function shuffledDeck() {
    return shuffleArray(cards);
}
module.exports = {
    shuffledDeck
}