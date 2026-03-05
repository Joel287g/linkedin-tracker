//? Imports de codigo
import { Controller, Get, Query } from "@nestjs/common";

//? Imports de usuario
import { ScraperStatsService, ScraperSynchronizeService } from "./services";

@Controller("scraper")
export class ScraperController {
  constructor(
    private readonly scraperService: ScraperSynchronizeService,
    private readonly statsService: ScraperStatsService,
  ) {}

  @Get("sync")
  async sync(@Query("page") page?: string, @Query("limit") limit?: string) {
    return await this.scraperService.runSync({
      startPage: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get("status")
  async getStatus() {
    return await this.statsService.getStatus();
  }

  @Get('ghosting')
  async ghosting() {
    return await this.statsService.getGhosting()
  }

  @Get("heat-map")
  async getHeatMap() {
    return await this.statsService.getHeatMap();
  }
}
