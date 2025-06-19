#!/usr/bin/env node

/* Wrapper pentru a rula scriptul TypeScript în orice mediu Node fără probleme
   cu extensia .ts.  
   Comanda din package.json va fi actualizată să folosească acest fişier. */

require('dotenv').config();

// Iniţializează ts-node ca să poată transpila fişierele .ts la zbor
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node'
  }
});

// Rulează efectiv scriptul TypeScript
require('./manual-recurring.ts'); 