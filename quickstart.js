/**
 * Copyright 2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// [START language_quickstart]
// Imports the Google Cloud client library
const Language = require('@google-cloud/language');

// Your Google Cloud Platform project ID
const projectId = 'kinetic-highway-127613';

// Instantiates a client
const languageClient = Language({
  projectId: projectId,
  keyFilename: "key.json"
});

// The text to analyze
const text = 'ちょっと頭が弱くて、親とかが尻拭いしてくれる層';

// Detects the sentiment of the text
languageClient.detectSentiment(text)
  .then((results) => {
    const sentiment = results[0];

    console.log(`Text: ${text}`);
    console.log(`Sentiment: ${sentiment}`);
    console.log(sentiment);
  });
// [END language_quickstart]