// ROUTE: --> /ws/
const router = require( 'express' ).Router(),
    db = require( '../modules/dbQuery' ),
    io = require( '../index' ).io;


// SOCKET.IO WS:
// define constructor function that gets `io` send to it
// function( io ) {
// };
io.on( 'connection', ( socket ) => {
    console.log( `socket with the id ${socket.id} is now connected` );

    socket.on( 'disconnect', () => {
        console.log( `socket with the id ${socket.id} is now disconnected` );
        // remove here the disconnected socket from the list of online users:
        /*
        it is possible for a single user to appear in the list more than once.
        it is important to only remove the item from the list that has the
        matching socket id when 'disconnect' event occurs
        */
        const disconnectedUserSocket = onlineUsers.find( user => user.socketId == socket.id );
        // console.log( 'disconnectedUserSocket: ', disconnectedUserSocket );

        onlineUsers.splice( onlineUsers.indexOf( disconnectedUserSocket ), 1 );
        // console.log( 'onlineUsers - after removing disconnectedUserSocket: ', onlineUsers );
        /*
        When a user disconnects, after removing the user with the id of the
        socket that disconnected from the list, you should determine if that
        user is no longer in your list at all. If the user is gone, the server
        should send a message to all connected clients with the id of the
        disconnected user in the payload so that they can update their lists of
        online users accordingly. Let's call this event 'userLeft'.
        */
        const disconnectedUserId = onlineUsers.filter( user => {
            return user.uid == disconnectedUserSocket.uid;
        } );
        // console.log( 'disconnectedUserId: ', disconnectedUserId );

        if ( disconnectedUserId.length === 0 ) {
            // console.log(`last user with id ${disconnectedUserSocket.uid} has gone offline`);
            io.sockets.emit( 'userLeft', { uid: disconnectedUserSocket.uid } );
        }

    } );

    socket.on( 'thanks', function ( data ) {
        console.log( data );
    } );

    socket.emit( 'welcome', {
        message: 'Welcome. It is nice to see you'
    } );
} );
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function makeSureUserIsLoggedIn( req, res, next ) {
    console.log( 'webSocket.js - fn: makeSureUserIsLoggedIn' );
    next();
}


let onlineUsers = [];
/* exemple...
onlineUsers = [
    {
        socketId: 'wJdwDQAKhUuXxZ2vAAAA',
        uid: 1
    }
]
*/

// SOCKET.IO ROUTES
/*  make a route that the client can hit after the socket connects.
    The /ws/connected/:socketId route can then read the user's id from
    the session and the socket id from req.params */
router.post( '/connected/:socketId', makeSureUserIsLoggedIn, ( req, res ) => {
    const uid = req.session.user.uid;
    const socketId = req.params.socketId;

    const socketAlreadyThere = onlineUsers.find( user => user.socketId == socketId );
    const userAlreadyThere = onlineUsers.find( user => user.userId == uid );

    console.log( `API: method: POST /ws/connected/:${socketId} - uid: ${uid} -
        onlineUsers: `, onlineUsers, '\n' );

    if ( !socketAlreadyThere && io.sockets.sockets[ socketId ] ) {
        /*  Every time a logged in user makes a request, push
        an object representing that user to an array after confirming that
        that user is not already in the list */
        onlineUsers.push( { socketId, uid } );

        /*  When a user is added to the list of online users, the server should
        send a message to that user with the list of all online users
        as the payload: event 'onlineUsers' */
        db.readAllUsersByIds( onlineUsers.map( user => user.uid ) )

            .then( onlineUsers => {
                // console.log( 'results: readAllUsersByIds - users: \n', users, '\n' );
                io.sockets.sockets[ socketId ].emit( 'onlineUsers', onlineUsers );
                // res.json( { success: true } );
                // console.log( 'onlineUsers: \n', onlineUsers, '\n' );
            } )

            .catch( err => console.log( err ) );

        /*  Also when a user is added to the list of online users,
        the server should send a message to all online users with information
        about the user who just came online as the payload, allowing all clients
        to keep their list of online users updated: event 'userJoined' */
        if ( !userAlreadyThere ) {
            db.getUserInfo( uid )

                .then( userInfo => io.sockets.emit( 'userJoined', userInfo ) )

                .catch( err => console.log( err ) );
        }
        // !userAlreadyThere && io.sockets.emit( 'userJoined' );
    }
} );




/* MODULE EXPORTS */
module.exports = router;
// module.exports.io = io;
