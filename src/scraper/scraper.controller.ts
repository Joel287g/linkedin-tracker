import { Controller, Get, Query } from "@nestjs/common";
import { ScraperSynchronizeService } from "./services/synchronize.service";

@Controller("scraper")
export class ScraperController {
  constructor(private readonly scraperService: ScraperSynchronizeService) {}

  @Get("sync")
  async sync(@Query("page") page?: string, @Query("limit") limit?: string) {
    return await this.scraperService.runSync({
      startPage: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }
}
