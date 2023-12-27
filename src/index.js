// @ts-nocheck
"use strict";
const { jwtDecode } = require("jwt-decode");

const ROLES = {
  ADMIN: "admin",
  AUTHENTICATED: "authenticated",
  WORKER: "worker",
  GUEST: "guest",
};

const SOCKET_ROOMS = {
  WORKERS: "workers",
};

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
    const getSocketUser = async (query) => {
      if (!query || !query.jwt) return null;
      try {
        const { id } = jwtDecode(query.jwt);

        const user = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({
            where: { id },
            populate: {
              role: true,
            },
          });
        return user;
      } catch (e) {
        return null;
      }
    };

    var io = require("socket.io")(strapi.server.httpServer, {
      cors: {
        //origin: "http://localhost:3000",
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", async function (socket) {
      const user = await getSocketUser(socket.handshake.query);
      if (!user) return socket.disconnect();

      console.log("USER AUTHORIZED", user.username);

      socket.on("completeRequest", async () => {
        if (user.role.type !== ROLES.WORKER) return;
        const request = await strapi.db.query("api::request.request").findOne({
          where: {
            status: "active",
            userWorker: user.id,
          },
        });

        if (!request) return;

        await strapi.db
          .query("api::request.request")
          .update({ where: { id: request.id }, data: { status: "completed" } });

        io.to(request.id).emit("requestCompleted");
        io.in(request.id).socketsLeave(request.id);
      });

      socket.on("message", async (data = {}) => {
        if (!data.text && !data.file) return;

        const request = await strapi.db.query("api::request.request").findOne({
          where: {
            status: "active",
            $or: [
              {
                userFrom: user.id,
              },
              {
                userWorker: user.id,
              },
            ],
            publishedAt: {
              $notNull: true,
            },
          },
        });

        if (!request) return;

        const messageData = {};

        if (data.text) messageData.text = data.text;
        if (data.file) messageData.file = data.file;

        strapi.db.query("api::message.message").create({
          data: {
            ...messageData,
            userFrom: user.id,
            publishedAt: new Date(),
            request: request.id,
          },
        });

        //io.to(SOCKET_ROOMS.WORKERS).emit("newMessage");
        io.to(request.id).emit("newMessage");
      });

      socket.on("join", async (data = {}) => {
        if (user.role.type === ROLES.AUTHENTICATED) {
          const message = data.message;

          let request = await strapi.db.query("api::request.request").findOne({
            where: {
              status: "active",
              userFrom: user.id,
              publishedAt: {
                $notNull: true,
              },
            },
          });

          if (!request) {
            if (!message) return;

            request = await strapi.db.query("api::request.request").create({
              data: {
                userFrom: user.id,
                publishedAt: new Date(),
              },
            });

            await strapi.db.query("api::message.message").create({
              data: {
                text: message,
                userFrom: user.id,
                request: request.id,
                publishedAt: new Date(),
              },
            });

            await strapi.service("api::request.request").addWorkerToRequest();

            request = await strapi.db.query("api::request.request").findOne({
              where: {
                id: request.id,
              },
              populate: {
                userWorker: true,
              },
            });

            io.to(request.userWorker.id).emit("newRequest");
          }

          socket.join(request.id);

          if (message) {
            io.to(request.id).emit("newMessage");
          }
        }

        if (user.role.type === ROLES.WORKER) {
          socket.join(user.id);

          const request = await strapi.db
            .query("api::request.request")
            .findOne({
              where: {
                userWorker: user.id,
                status: "active",
                publishedAt: {
                  $notNull: true,
                },
              },
            });

          if (!request) return;

          socket.join(request.id);
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
