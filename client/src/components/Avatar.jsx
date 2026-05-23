const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };

const Avatar = ({ src, name = "?", size = "md" }) => {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = ["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500"];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
    >
      {initials}
    </div>
  );
};

export default Avatar;
