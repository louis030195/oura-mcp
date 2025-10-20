#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const OURA_API_KEY = process.env.OURA_API_KEY;

if (!OURA_API_KEY) {
  console.error("Error: OURA_API_KEY environment variable is required");
  console.error("Get your API key from: https://cloud.ouraring.com/personal-access-tokens");
  process.exit(1);
}

class OuraClient {
  private api: AxiosInstance;

  constructor(apiKey: string) {
    this.api = axios.create({
      baseURL: "https://api.ouraring.com/v2",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async getDailySleep(startDate: string, endDate?: string) {
    const params: any = { start_date: startDate };
    if (endDate) params.end_date = endDate;

    const response = await this.api.get("/usercollection/daily_sleep", { params });
    return response.data;
  }

  async getDailyReadiness(startDate: string, endDate?: string) {
    const params: any = { start_date: startDate };
    if (endDate) params.end_date = endDate;

    const response = await this.api.get("/usercollection/daily_readiness", { params });
    return response.data;
  }

  async getDailyActivity(startDate: string, endDate?: string) {
    const params: any = { start_date: startDate };
    if (endDate) params.end_date = endDate;

    const response = await this.api.get("/usercollection/daily_activity", { params });
    return response.data;
  }

  async getHeartRate(startDate: string, endDate?: string) {
    const params: any = { start_date: startDate };
    if (endDate) params.end_date = endDate;

    const response = await this.api.get("/usercollection/heartrate", { params });
    return response.data;
  }
}

const DateRangeSchema = z.object({
  start_date: z.string().describe("Start date in YYYY-MM-DD format"),
  end_date: z.string().optional().describe("Optional end date in YYYY-MM-DD format"),
});

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

async function main() {
  const client = new OuraClient(OURA_API_KEY!);
  const server = new Server({
    name: "oura-mcp",
    version: "0.1.0",
  }, {
    capabilities: {
      tools: {},
    },
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "oura_sleep",
        description: "Get daily sleep data including sleep score, sleep stages (REM, deep, light), and sleep duration",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date in YYYY-MM-DD format",
            },
            end_date: {
              type: "string",
              description: "Optional end date in YYYY-MM-DD format",
            },
          },
          required: ["start_date"],
        },
      },
      {
        name: "oura_readiness",
        description: "Get daily readiness score, HRV balance, resting heart rate, and body temperature",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date in YYYY-MM-DD format",
            },
            end_date: {
              type: "string",
              description: "Optional end date in YYYY-MM-DD format",
            },
          },
          required: ["start_date"],
        },
      },
      {
        name: "oura_activity",
        description: "Get daily activity data including steps, calories, and activity score",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date in YYYY-MM-DD format",
            },
            end_date: {
              type: "string",
              description: "Optional end date in YYYY-MM-DD format",
            },
          },
          required: ["start_date"],
        },
      },
      {
        name: "oura_heartrate",
        description: "Get heart rate data over time",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date in YYYY-MM-DD format",
            },
            end_date: {
              type: "string",
              description: "Optional end date in YYYY-MM-DD format",
            },
          },
          required: ["start_date"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    try {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "oura_sleep": {
          const { start_date, end_date } = DateRangeSchema.parse(args);
          const data = await client.getDailySleep(start_date, end_date);

          if (!data.data || data.data.length === 0) {
            return {
              content: [{
                type: "text",
                text: "No sleep data found for the specified date range",
              }],
            };
          }

          const sleepData = data.data.map((d: any) => {
            const contributors = d.contributors || {};
            return {
              date: d.day,
              score: d.score || 0,
              deep_sleep: contributors.deep_sleep || 0,
              rem_sleep: contributors.rem_sleep || 0,
              light_sleep: contributors.light_sleep || 0,
              efficiency: contributors.efficiency || 0,
              restfulness: contributors.restfulness || 0,
              timing: contributors.timing || 0,
              total_sleep: contributors.total_sleep || 0,
              latency: contributors.latency || 0,
            };
          });

          const avgScore = Math.round(sleepData.reduce((sum: number, d: any) => sum + d.score, 0) / sleepData.length);

          const formatted = sleepData.map((d: any) =>
            `${d.date}: Sleep ${d.score}/100 (Deep: ${d.deep_sleep}, REM: ${d.rem_sleep}, Efficiency: ${d.efficiency})`
          ).join("\n");

          return {
            content: [{
              type: "text",
              text: `Sleep Data (${start_date} to ${end_date || start_date}):\n\n${formatted}\n\nAverage Sleep Score: ${avgScore}/100`,
            }],
          };
        }

        case "oura_readiness": {
          const { start_date, end_date } = DateRangeSchema.parse(args);
          const data = await client.getDailyReadiness(start_date, end_date);

          if (!data.data || data.data.length === 0) {
            return {
              content: [{
                type: "text",
                text: "No readiness data found for the specified date range",
              }],
            };
          }

          const readinessData = data.data.map((d: any) => {
            const contributors = d.contributors || {};
            return {
              date: d.day,
              score: d.score || 0,
              hrv_balance: contributors.hrv_balance || 0,
              resting_heart_rate: contributors.resting_heart_rate || 0,
              body_temp: contributors.body_temperature || 0,
              temp_deviation: d.temperature_deviation || 0,
              recovery_index: contributors.recovery_index || 0,
              sleep_balance: contributors.sleep_balance || 0,
            };
          });

          const avgScore = Math.round(readinessData.reduce((sum: number, d: any) => sum + d.score, 0) / readinessData.length);

          const formatted = readinessData.map((d: any) =>
            `${d.date}: Readiness ${d.score}/100 (HRV: ${d.hrv_balance}, RHR: ${d.resting_heart_rate}, Temp: ${d.temp_deviation > 0 ? '+' : ''}${d.temp_deviation.toFixed(2)}°C)`
          ).join("\n");

          return {
            content: [{
              type: "text",
              text: `Readiness Data (${start_date} to ${end_date || start_date}):\n\n${formatted}\n\nAverage Readiness Score: ${avgScore}/100`,
            }],
          };
        }

        case "oura_activity": {
          const { start_date, end_date } = DateRangeSchema.parse(args);
          const data = await client.getDailyActivity(start_date, end_date);

          if (!data.data || data.data.length === 0) {
            return {
              content: [{
                type: "text",
                text: "No activity data found for the specified date range",
              }],
            };
          }

          const activityData = data.data.map((d: any) => ({
            date: d.day,
            score: d.score || 0,
            steps: d.steps || 0,
            calories: d.active_calories || 0,
          }));

          const avgScore = Math.round(activityData.reduce((sum: number, d: any) => sum + d.score, 0) / activityData.length);
          const totalSteps = activityData.reduce((sum: number, d: any) => sum + d.steps, 0);

          const formatted = activityData.map((d: any) =>
            `${d.date}: Activity ${d.score}/100 (Steps: ${d.steps.toLocaleString()}, Calories: ${d.calories})`
          ).join("\n");

          return {
            content: [{
              type: "text",
              text: `Activity Data (${start_date} to ${end_date || start_date}):\n\n${formatted}\n\nAverage Activity Score: ${avgScore}/100\nTotal Steps: ${totalSteps.toLocaleString()}`,
            }],
          };
        }

        case "oura_heartrate": {
          const { start_date, end_date } = DateRangeSchema.parse(args);
          const data = await client.getHeartRate(start_date, end_date);

          if (!data.data || data.data.length === 0) {
            return {
              content: [{
                type: "text",
                text: "No heart rate data found for the specified date range",
              }],
            };
          }

          const hrData = data.data.slice(0, 20); // Limit to first 20 points to avoid spam

          const formatted = hrData.map((d: any) =>
            `${d.timestamp}: ${d.bpm} bpm (Source: ${d.source})`
          ).join("\n");

          return {
            content: [{
              type: "text",
              text: `Heart Rate Data (${start_date} to ${end_date || start_date}):\n\n${formatted}\n\n(Showing first 20 data points)`,
            }],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }

      if (error.response?.status === 401) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          "Invalid Oura API key. Check your OURA_API_KEY environment variable."
        );
      }

      throw new McpError(
        ErrorCode.InternalError,
        error.message || "An unexpected error occurred"
      );
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Oura MCP server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
