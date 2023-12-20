"use strict";

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    var io = require("socket.io")(strapi.server.httpServer, {
      cors: {
        // cors setup
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", function (socket) {
      socket.on("join", async (data) => {
        const userId = data.userId;

        const user = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({
            where: { id: userId },
            populate: {
              role: true,
            },
          });

        if (!user) return;

        if (user.role.type === "authenticated") {
          const message = data.message;

          let group = await strapi.db.query("api::request.request").findOne({
            where: {
              status: "active",
              userFrom: userId,
              publishedAt: {
                $notNull: true,
              },
            },
          });

          if (!group) {
            if (!message) return;

            group = await strapi.db.query("api::request.request").create({
              data: {
                userFrom: userId,
                publishedAt: new Date(),
              },
            });

            await strapi.db.query("api::message.message").create({
              data: {
                text: message,
                userFrom: userId,
                request: group.id,
                publishedAt: new Date(),
              },
            });
          }
        }

        if (user.role.type === "worker" && data.groupId) {
          const groupId = data.groupId;

          const group = await strapi.db.query("api::request.request").findOne({
            where: {
              id: groupId,
              status: "active",
              publishedAt: {
                $notNull: true,
              },
            },
          });

          if (!group) return;

          await strapi.db.query("api::request.request").update({
            where: { id: groupId },
            data: {
              userWorker: userId,
            },
          });

          socket.join(groupId);
        }
      });
    });

    //const ADMIN = "Admin";

    // state
    //const UsersState = {
    //  users: [],
    //  setUsers: function (newUsersArray) {
    //    this.users = newUsersArray;
    //  },
    //};

    //io.on("connection", (socket) => {
    //  console.log(`User ${socket.id} connected`);

    //  // Upon connection - only to user
    //  socket.emit("message", buildMsg(ADMIN, "Welcome to Chat App!"));

    //  socket.on("enterRoom", ({ name, room }) => {
    //    console.log(name, room);
    //    // leave previous room
    //    const prevRoom = getUser(socket.id)?.room;
    //    console.log(prevRoom);

    //    if (prevRoom) {
    //      socket.leave(prevRoom);
    //      io.to(prevRoom).emit(
    //        "message",
    //        buildMsg(ADMIN, `${name} has left the room`)
    //      );
    //    }

    //    const user = activateUser(socket.id, name, room);

    //    // Cannot update previous room users list until after the state update in activate user
    //    if (prevRoom) {
    //      io.to(prevRoom).emit("userList", {
    //        users: getUsersInRoom(prevRoom),
    //      });
    //    }

    //    // join room
    //    socket.join(user.room);

    //    // To user who joined
    //    socket.emit(
    //      "message",
    //      buildMsg(ADMIN, `You have joined the ${user.room} chat room`)
    //    );

    //    // To everyone else
    //    socket.broadcast
    //      .to(user.room)
    //      .emit("message", buildMsg(ADMIN, `${user.name} has joined the room`));

    //    // Update user list for room
    //    io.to(user.room).emit("userList", {
    //      users: getUsersInRoom(user.room),
    //    });

    //    // Update rooms list for everyone
    //    io.emit("roomList", {
    //      rooms: getAllActiveRooms(),
    //    });
    //  });

    //  // When user disconnects - to all others
    //  socket.on("disconnect", () => {
    //    const user = getUser(socket.id);
    //    userLeavesApp(socket.id);

    //    if (user) {
    //      io.to(user.room).emit(
    //        "message",
    //        buildMsg(ADMIN, `${user.name} has left the room`)
    //      );

    //      io.to(user.room).emit("userList", {
    //        users: getUsersInRoom(user.room),
    //      });

    //      io.emit("roomList", {
    //        rooms: getAllActiveRooms(),
    //      });
    //    }

    //    console.log(`User ${socket.id} disconnected`);
    //  });

    //  // Listening for a message event
    //  socket.on("message", ({ name, text }) => {
    //    const room = getUser(socket.id)?.room;
    //    if (room) {
    //      io.to(room).emit("message", buildMsg(name, text));
    //    }
    //  });

    //  // Listen for activity
    //  socket.on("activity", (name) => {
    //    const room = getUser(socket.id)?.room;
    //    if (room) {
    //      socket.broadcast.to(room).emit("activity", name);
    //    }
    //  });
    //});

    //function buildMsg(name, text) {
    //  return {
    //    name,
    //    text,
    //    time: new Intl.DateTimeFormat("default", {
    //      hour: "numeric",
    //      minute: "numeric",
    //      second: "numeric",
    //    }).format(new Date()),
    //  };
    //}

    //// User functions
    //function activateUser(id, name, room) {
    //  const user = { id, name, room };
    //  UsersState.setUsers([
    //    ...UsersState.users.filter((user) => user.id !== id),
    //    user,
    //  ]);
    //  return user;
    //}

    //function userLeavesApp(id) {
    //  UsersState.setUsers(UsersState.users.filter((user) => user.id !== id));
    //}

    //function getUser(id) {
    //  return UsersState.users.find((user) => user.id === id);
    //}

    //function getUsersInRoom(room) {
    //  return UsersState.users.filter((user) => user.room === room);
    //}

    //function getAllActiveRooms() {
    //  return Array.from(new Set(UsersState.users.map((user) => user.room)));
    //}
  },
};
