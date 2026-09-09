import { Platform } from "react-native";

const API_URL = Platform.select({
  web: "http://localhost:4000",
  android: "http://10.0.2.2:4000",
  ios: "http://localhost:4000",
  default: "http://localhost:4000",
});

export default API_URL;
