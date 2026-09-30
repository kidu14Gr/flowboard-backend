const dotenv = require("dotenv");
const app = require("./app");
const connectDatabase = require("./config/database");

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`FlowBoard backend running on port ${PORT}`);
  });
};

startServer();