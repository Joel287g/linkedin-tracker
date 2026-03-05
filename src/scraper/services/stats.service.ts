//? Imports de codigo
import { Injectable, Logger } from "@nestjs/common";

//? Imports de usuario
import { ScraperPersistenceService } from "./persistence.service";

@Injectable()
export class ScraperStatsService {
  constructor(private readonly persistenceService: ScraperPersistenceService) {}

  private readonly logger = new Logger(this.constructor.name);

  async getStatus() {
    try {
      const data = await this.persistenceService.getStatus();

      if (!data || data.length === 0 || !Array.isArray(data)) return [];

      const total = data.reduce((acc, curr) => acc + curr.total, 0);

      const labels: String[] = [];
      const values: number[] = [];
      const percentages: number[] = [];
      const bars: string[] = [];

      data.forEach((item, index) => {
        labels.push(item._id);
        values.push(item.total);
        percentages.push((item.total / total) * 100);
        const filledLength = Math.round((percentages[index] / 100) * 30);
        const bar = "█".repeat(filledLength).padEnd(30, "░");
        bars.push(bar);
      });

      const chart: Object[] = [];

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const value = values[i];
        const percentage = percentages[i];
        const bar = bars[i];

        chart.push({
          label,
          value,
          percentage,
          bar,
        });
      }

      return chart;
    } catch (error) {
      this.logger.error("Error al obtener estadísticas", error);
      throw error;
    }
  }
}
