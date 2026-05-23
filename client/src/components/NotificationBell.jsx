import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  formatDistanceToNow,
} from "date-fns";

import useNotificationStore
from "../store/notificationStore";

const NotificationBell =
  () => {

    const [

      open,

      setOpen,

    ] = useState(false);

    const {

      notifications,

      unreadCount,

      fetchNotifications,

      markAllRead,

    } =
      useNotificationStore();

    const ref =
      useRef(null);

    // LOAD
    useEffect(() => {

      fetchNotifications();

    }, []);

    // OUTSIDE CLICK
    useEffect(() => {

      const handleClick =
        (e) => {

          if (

            ref.current &&

            !ref.current.contains(
              e.target
            )

          ) {

            setOpen(
              false
            );

          }

        };

      document.addEventListener(
        "mousedown",
        handleClick
      );

      return () =>

        document.removeEventListener(
          "mousedown",
          handleClick
        );

    }, []);

    // TOGGLE
    const toggleNotifications =
      () => {

        setOpen(
          !open
        );

        if (
          unreadCount > 0
        ) {

          markAllRead();

        }

      };

    return (

      <div
        ref={ref}
        className="relative"
      >

        {/* BUTTON */}
        <button
          onClick={
            toggleNotifications
          }
          className="relative text-xl"
        >

          🔔

          {unreadCount >
            0 && (

            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold">

              {unreadCount}

            </span>

          )}

        </button>

        {/* PANEL */}
        {open && (

          <div className="fixed top-16 left-[260px] w-[340px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-[999999999] overflow-hidden">

            {/* HEADER */}
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">

              <h2 className="text-white font-semibold">

                Notifications

              </h2>

              <button
                onClick={
                  markAllRead
                }
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >

                Clear

              </button>

            </div>

            {/* LIST */}
            <div className="max-h-[450px] overflow-y-auto">

              {notifications.length ===
              0 ? (

                <div className="p-6 text-center text-gray-400 text-sm">

                  No notifications

                </div>

              ) : (

                notifications.map(
                  (n) => (

                    <div
                      key={n._id}
                      className="p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors"
                    >

                      <div className="flex items-start gap-3">

                        {/* ICON */}
                        <div className="text-2xl">

                          🔔

                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 min-w-0">

                          <p className="text-white text-sm font-medium truncate">

                            {n.sender
                              ?.username ||

                              "User"}

                          </p>

                          <p className="text-gray-400 text-xs mt-1 break-words">

                            {n.text ||

                              "New notification"}

                          </p>

                          <p className="text-gray-500 text-[11px] mt-2">

                            {n.createdAt

                              ? formatDistanceToNow(
                                  new Date(
                                    n.createdAt
                                  ),

                                  {
                                    addSuffix:
                                      true,
                                  }
                                )

                              : ""}

                          </p>

                        </div>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        )}

      </div>

    );

  };
  export const showBrowserNotif =
  (
    title,
    body,
    icon
  ) => {

    if (

      "Notification" in
        window &&

      Notification.permission ===
        "granted"

    ) {

      new Notification(
        title,
        {

          body,

          icon:
            icon ||
            "/favicon.svg",

        }
      );

    }

  };

export default
  NotificationBell;