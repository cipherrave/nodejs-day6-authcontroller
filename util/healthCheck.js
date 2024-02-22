export default async function healthCheck(req, res) {
  const healthObject = {
    health: "OK",
  };
  res.status(200).json(healthObject);
}
