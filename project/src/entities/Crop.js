import { createEntityClient } from "../utils/entityWrapper";
import schema from "./Crop.json";
export const Crop = createEntityClient("Crop", schema);
