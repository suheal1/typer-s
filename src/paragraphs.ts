export const PARAGRAPHS = [
  "The quick brown fox jumps over the lazy dog. This classic sentence contains every letter of the English alphabet, making it a perfect choice for typing practice and font testing. Speed and accuracy are both essential when mastering the art of typing.",
  "Programming is the process of creating a set of instructions that tell a computer how to perform a task. It involves logic, creativity, and problem-solving skills. From simple scripts to complex systems, code powers the modern world in ways we often take for granted.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. Winston Churchill's words remind us that persistence is key in any endeavor. Whether you are learning to type or building a career, the journey is just as important as the destination.",
  "In the heart of the digital age, information flows at the speed of light. Connecting people across continents, the internet has transformed how we communicate, work, and play. Understanding technology is no longer optional; it is a fundamental skill for the twenty-first century.",
  "Nature always wears the colors of the spirit. Ralph Waldo Emerson's observation highlights the deep connection between our inner world and the environment around us. Taking a moment to appreciate the beauty of a sunset or the rustle of leaves can bring peace to a busy mind."
];

export const getRandomParagraph = () => {
  return PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
};
