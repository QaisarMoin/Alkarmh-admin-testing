const StatCard = ({
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  cardClass = "",
}) => {
  // Determine color based on change type
  const changeColor =
    changeType === "positive"
      ? "text-success-500"
      : changeType === "negative"
      ? "text-error-500"
      : "text-gray-500";

  return (
    <div className={`card flex flex-col ${cardClass}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && (
          <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {change && (
          <span className={`ml-2 text-sm ${changeColor} flex items-center`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
