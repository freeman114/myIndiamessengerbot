'use strict';

// const WIT_TOKEN = process.env.WIT_TOKEN || 'ACDQX6X4RVCKZEX52QNVWDZYC6OPLPUZ'
// if (!WIT_TOKEN) {
//   throw new Error('Missing WIT_TOKEN. Go to https://wit.ai/docs/quickstart to get one.')
// }


var FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'EAADhs54CZBV4BAHe6u2qppRs0BDDGbV3ZAtF9QfIbRZB8zUKKlmUtRQFK4kzNnTk3rcec5WYyIyLTfYFoR5GvVvIvoWdi40wIMxspQVBJFmqUoXZCcJrqN8wZC4FRQKOW3CImPSXf7ia6ZA8xZBIP4xG6dHWLRrvyHZCbb1ayu33RNb1cwMhk0ZCzryigq2YuVO4ZD';
if (!FB_PAGE_TOKEN) {
	throw new Error('Missing FB_PAGE_TOKEN. Go to https://developers.facebook.com/docs/pages/access-tokens to get one.')
}

var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'facebookmessengerapp-1'

module.exports = {
//   WIT_TOKEN: WIT_TOKEN,
  FB_PAGE_TOKEN: FB_PAGE_TOKEN,
  FB_VERIFY_TOKEN: FB_VERIFY_TOKEN,
}