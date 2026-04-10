const isOneToOneBooking = ({ instructorId, studentId }) => {
  if (!instructorId || !studentId) {
    return false;
  }

  return String(instructorId) !== String(studentId);
};

const isSingleSessionCount = ({ current, total }) =>
  Number(current) === 1 && Number(total) === 1;

module.exports = {
  isOneToOneBooking,
  isSingleSessionCount,
};
