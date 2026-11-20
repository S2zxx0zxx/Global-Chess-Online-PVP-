import { chooseComputerMove } from './computer.js';

self.onmessage = ({data:{fen,difficulty}}) => {
  self.postMessage(chooseComputerMove(fen,difficulty));
};
