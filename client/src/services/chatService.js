import api
from "./api";

// CHAT SERVICE
export const chatService = {

  // GET CHATS
  getMyChats:
    () =>

      api.get(
        "/chats"
      ),

  // DIRECT CHAT
  getOrCreateDirect:
    (userId) =>

      api.post(
        "/chats/direct",
        {
          userId,
        }
      ),

  // CREATE GROUP
  createGroup:
    (data) => {

      const payload = {

        chatName:

          data.name ||

          data.chatName,

        users:

          data.participants ||

          data.users,

        description:
          data.description,

      };

      return api.post(
        "/chats/group",
        payload
      );

    },

  // ADD MEMBER
  addMember:
    (
      chatId,
      userId
    ) =>

      api.put(
        `/chats/${chatId}/add`,
        {
          userId,
        }
      ),

  // LEAVE GROUP
  leaveGroup:
    (chatId) =>

      api.delete(
        `/chats/${chatId}/leave`
      ),

  // DELETE CHAT
  deleteChat:
    (chatId) =>

      api.delete(
        `/chats/${chatId}`
      ),

  // SAVE CALL HISTORY
  createCallMessage:
    (data) =>

      api.post(
        "/messages/call",
        data
      ),

};

// MESSAGE SERVICE
export const messageService = {

  // GET MESSAGES
  getMessages:
    (
      chatId,
      page = 1
    ) =>

      api.get(
        `/messages/${chatId}?page=${page}`
      ),

  // SEND MESSAGE
  sendMessage:
    (data) =>

      api.post(
        "/messages",
        data
      ),

  // EDIT
  editMessage:
    (
      id,
      content
    ) =>

      api.put(
        `/messages/${id}`,
        {
          content,
        }
      ),

  // DELETE
  deleteMessage:
    (id) =>

      api.delete(
        `/messages/${id}`
      ),

  // REACT
  reactToMessage:
    (
      id,
      emoji
    ) =>

      api.post(
        `/messages/${id}/react`,
        {
          emoji,
        }
      ),

  // READ
  markAsRead:
    (chatId) =>

      api.put(
        `/messages/${chatId}/read`
      ),

};

// USER SERVICE
export const userService = {

  searchUsers:
    (q) =>

      api.get(
        `/users/search?q=${encodeURIComponent(q)}`
      ),

  getUserById:
    (id) =>

      api.get(
        `/users/${id}`
      ),

  updateProfile:
    (data) =>

      api.put(
        "/users/profile",
        data
      ),

};