import express from "express";
import z from "zod";
import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
const PORT = 3001;

const schoolSchema = z.object({
  name: z.string().nonempty(),
  address: z.string().nonempty(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-90).max(90),
});

const listSchoolsSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-90).max(90),
});

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

app.post("/addSchool", async (req, res) => {
  const validatedData = schoolSchema.safeParse(req.body);

  if (!validatedData.success) {
    res.status(400).json({ error: validatedData.error.errors });
    return;
  }

  try {
    const newSchool = await prisma.school.create({
      data: {
        name: validatedData.data.name,
        address: validatedData.data.address,
        latitude: validatedData.data.latitude,
        longitude: validatedData.data.longitude,
      },
    });

    res.status(201).json(newSchool);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create school" });
  }
});

app.get("/listSchools", async (req, res) => {
  const validatedData = listSchoolsSchema.safeParse(req.query);

  if (!validatedData.success) {
    res.status(400).json({ error: validatedData.error.errors });
    return;
  }

  const { latitude, longitude } = validatedData.data;

  try {
    const schools = await prisma.school.findMany();

    const sortedSchools = schools
      .map((school) => ({
        ...school,
        distance: getDistance(
          latitude,
          longitude,
          school.latitude,
          school.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    res.json(sortedSchools);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch schools" });
  }
});

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
