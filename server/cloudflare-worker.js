import solverModule from './cha.generated.wasm';
import { initializeMateSolver } from '../src/mate-solver.js';

initializeMateSolver(solverModule);
export { default, Room } from './worker.js';
