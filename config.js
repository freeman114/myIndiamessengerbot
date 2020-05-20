'use strict';

// const WIT_TOKEN = process.env.WIT_TOKEN || 'ACDQX6X4RVCKZEX52QNVWDZYC6OPLPUZ'
// if (!WIT_TOKEN) {
//   throw new Error('Missing WIT_TOKEN. Go to https://wit.ai/docs/quickstart to get one.')
// }


var FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'EAADhs54CZBV4BAJRpoILMSQ1jdhgqzthNOVc3s5XZBRDtBiRoOQ9sRyUCez3wcsZCN1kUkKfL3vI5oaAwcoWPereW0OjZCKZCWi888zRp9qbv8p4xXC1zUGTeZB6BCYpBJdFSy93GGzKatNuy8CZC5VRYlnZCSdyIWZBnSJwNYZBx32f9RFAnPBstSq8gZBZBrIONNAZD';
if (!FB_PAGE_TOKEN) {
	throw new Error('Missing FB_PAGE_TOKEN. Go to https://developers.facebook.com/docs/pages/access-tokens to get one.')
}

var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'facebookmessengerapp-1'

module.exports = {
//   WIT_TOKEN: WIT_TOKEN,
  FB_PAGE_TOKEN: FB_PAGE_TOKEN,
  FB_VERIFY_TOKEN: FB_VERIFY_TOKEN,
}