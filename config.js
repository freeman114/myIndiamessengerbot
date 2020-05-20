'use strict';

// const WIT_TOKEN = process.env.WIT_TOKEN || 'ACDQX6X4RVCKZEX52QNVWDZYC6OPLPUZ'
// if (!WIT_TOKEN) {
//   throw new Error('Missing WIT_TOKEN. Go to https://wit.ai/docs/quickstart to get one.')
// }


var FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'EAADhs54CZBV4BAPYji70OoBKOgYUXj1y3tsdwFbCuRMoZAJwyv5EAgWD8GJT5UxlFJRpJkBDegyqnCue2ko3T01zVF9egZBB8TZABBZAap6Y4HICmDPpUaBFB0ZBrjwl9ZAfZCJXede3LNP7NziYZA07hoRwTBCEYwQeAPuZC7R6JALrk9GiLm9NrRdYYzeCm6HoIZD';
if (!FB_PAGE_TOKEN) {
	throw new Error('Missing FB_PAGE_TOKEN. Go to https://developers.facebook.com/docs/pages/access-tokens to get one.')
}

var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'facebookmessengerapp-1'

module.exports = {
//   WIT_TOKEN: WIT_TOKEN,
  FB_PAGE_TOKEN: FB_PAGE_TOKEN,
  FB_VERIFY_TOKEN: FB_VERIFY_TOKEN,
}