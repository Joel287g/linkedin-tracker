import { Module } from "@nestjs/common";
import { ScraperModule } from "./scraper/scraper.module";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ScraperModule,
    MongooseModule.forRoot(
      'mongodb://admin:password123@localhost:27017/linkedin_tracker?authSource=admin'
    ),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
