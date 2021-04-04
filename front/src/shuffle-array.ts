// From https://stackoverflow.com/a/12646864.
/* Randomize array in-place using Durstenfeld shuffle algorithm */
export default function shuffleArray (array: any[]): void {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}
