A simple client for the Ambient chat server.
To run:
* `npm install`
* `bower install`
* `grunt`
-----
To actually see anything, first create a message between two users in Redis. A basic message looks like:
`{from: 'userId1', to: 'userId2', text: 'blah blah'}`.
Then you can log into the client using `userId1` or `userId2` as the username - they're both going to see each other, and they can chat.
