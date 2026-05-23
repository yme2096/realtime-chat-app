import { create } from "zustand";

const useCallStore = create((set) => ({

  // ACTIVE CALL
  activeCall: null,

  // INCOMING CALL
  incomingCall: null,

  // SET ACTIVE CALL
  setActiveCall: (callData) =>

    set({

      activeCall: callData,

      incomingCall: null,

    }),

  // SET INCOMING CALL
  setIncomingCall: (callData) =>

    set({

      incomingCall: callData,

    }),

  // ACCEPT CALL
  acceptIncomingCall: () =>

    set((state) => {

      if (
        !state.incomingCall
      ) {

        return {};

      }

      return {

        activeCall: {

          chatId:
            state
              .incomingCall
              .chatId,

          callType:
            state
              .incomingCall
              .callType,

          isCaller:
            false,

          remoteUser:
            state
              .incomingCall
              .caller,

          callerSignal:
            state
              .incomingCall
              .signal,

        },

        incomingCall:
          null,

      };

    }),

  // CLEAR
  clearCall: () =>

    set({

      activeCall: null,

      incomingCall: null,

    }),

}));

export default useCallStore;