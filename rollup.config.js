import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/callyflower.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/callyflower.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/callyflower.min.js',
      format: 'iife',
      name: 'CallyFlower',
      sourcemap: true,
      plugins: [terser()]
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' })
  ]
};