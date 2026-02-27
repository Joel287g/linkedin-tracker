//? Imports de codigo
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";

//? Imports de usuario
import { ScraperModule } from "./scraper/scraper.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      "mongodb://admin:password123@localhost:27017/linkedin_tracker?authSource=admin",
    ),
    ScraperModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
