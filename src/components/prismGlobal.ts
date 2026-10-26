import Prism from 'prismjs';

// Prism's language files look for a global `Prism`, which only exists in Node-style bundles.
// This module must be imported before them so the global is set when they evaluate.
(globalThis as { Prism?: typeof Prism }).Prism = Prism;
Prism.manual = true;

export default Prism;
