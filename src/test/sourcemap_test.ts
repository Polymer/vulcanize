/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
import * as chai from 'chai';
import * as dom5 from 'dom5';
import * as parse5 from 'parse5';
import * as path from 'path';
import {Analyzer} from 'polymer-analyzer';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import {MappingItem, SourceMapConsumer} from 'source-map';

import {Bundler} from '../bundler';
import {Options as BundlerOptions} from '../bundler';
import {getExistingSourcemap} from '../source-map';


chai.config.showDiff = true;

const assert = chai.assert;
const matchers = require('../matchers');

suite('Bundler', () => {
  let bundler: Bundler;

  async function bundle(inputPath: string, opts?: BundlerOptions):
      Promise<parse5.ASTNode> {
        // Don't modify options directly because test-isolation problems occur.
        const bundlerOpts = Object.assign({}, opts || {});
        if (!bundlerOpts.analyzer) {
          bundlerOpts.analyzer = new Analyzer({urlLoader: new FSUrlLoader()});
          inputPath = path.basename(inputPath);
        }
        bundler = new Bundler(bundlerOpts);
        const documents = await bundler.bundle([inputPath]);
        return documents.get(inputPath)!.ast;
      }

  function getLine(original: string, lineNum: number) {
    const lines = original.split('\n');
    if (lines.length >= lineNum) {
      return lines[lineNum - 1];
    }
    return null;
  }

  suite('Sourcemaps', () => {

    test('Basic', async() => {
      const basePath = 'test/html/sourcemaps';
      const urlLoader = new FSUrlLoader(basePath);
      const analyzer = new Analyzer({urlLoader: urlLoader});
      const doc = await bundle(
          'A.html',
          {inlineScripts: true, sourcemaps: true, analyzer: analyzer});
      assert(doc);
      const compiledHtml = parse5.serialize(doc);

      const inlineScripts = dom5.queryAll(doc, matchers.inlineJavascript);
      assert.equal(inlineScripts.length, 6);

      for (let i = 0; i < inlineScripts.length; i++) {
        if (i === 5) {
          continue;
        }

        const sourcemap = await getExistingSourcemap(
            analyzer, 'A.html', dom5.getTextContent(inlineScripts[i]));

        assert(sourcemap, 'scripts found');

        const consumer = new SourceMapConsumer(sourcemap!);
        let foundMapping = false;
        const mappings: MappingItem[] = [];
        consumer.eachMapping(mapping => mappings.push(mapping));
        for (let j = 0; j < mappings.length; j++) {
          if (mappings[j].name === 'console') {
            foundMapping = true;
            const generatedLine =
                getLine(compiledHtml, mappings[j].generatedLine);
            assert(generatedLine, 'line found');
            assert.equal(
                mappings[j].generatedColumn, generatedLine!.indexOf('console'));

            const originalContents = await urlLoader.load(mappings[j].source);
            const originalLine =
                getLine(originalContents, mappings[j].originalLine);
            assert(originalLine, 'line found');
            assert.equal(
                mappings[j].originalColumn, originalLine!.indexOf('console'));
          }
        }
      }
    });
  });
});