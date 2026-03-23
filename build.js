// build.js
import { build } from "esbuild";
import { YAMLPlugin } from "esbuild-yaml";

// Unused
// Intended to build yaml filesinto single output however the import syntax does breaks normal development
build(
    {
        platform: 'node',
        bundle: true,
        minify: true,
        entryPoints: ['./server.js'],
        format: 'cjs',
        outfile: 'dist/evaluationapp-min.cjs',
        plugins: [
            YAMLPlugin(), 
        ],
        loader:
        {
            ".yaml": "text"
        },
    })