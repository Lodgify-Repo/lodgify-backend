import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Request, Param, Query, Res, Header } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { OccupancyAnalyticsService } from '../services/occupancy-analytics.service';
import { RevenueReportsService } from '../services/revenue-reports.service';
import { BookingListService } from '../services/booking-list.service';
import { TodayOperationsService } from '../services/today-operations.service';
import { PropertyOwnerDashboardService } from '../services/property-owner-dashboard.service';
import { AgentDashboardService } from '../services/agent-dashboard.service';
import { InventoryReportsService } from '../services/inventory-reports.service';
import { FnbAnalyticsService } from '../services/fnb-analytics.service';
import { DateRangeQueryDto, BookingListQueryDto, BookingExportQueryDto, OccupancyQueryDto } from '../dto/dashboard.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly occupancyAnalyticsService: OccupancyAnalyticsService,
    private readonly revenueReportsService: RevenueReportsService,
    private readonly bookingListService: BookingListService,
    private readonly todayOperationsService: TodayOperationsService,
    private readonly propertyOwnerDashboardService: PropertyOwnerDashboardService,
    private readonly agentDashboardService: AgentDashboardService,
    private readonly inventoryReportsService: InventoryReportsService,
    private readonly fnbAnalyticsService: FnbAnalyticsService,
  ) {}

  // Admin

  @Roles(Role.SUPER_ADMIN)
  @Get('admin/stats')
  @ApiOperation({ summary: 'Get admin stats' })
  async getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  // Owner Dashboard 

  @Roles(Role.HOTEL_OWNER)
  @Get('owner')
  @ApiOperation({
    summary: 'F-D01: Owner Dashboard',
    description: 'Overview: arrivals/departures, occupancy rate, revenue (rooms + food), inventory alerts, pending bookings.',
  })
  @ApiResponse({ status: 200, description: 'Owner dashboard data' })
  async getOwnerDashboard(@Request() req: any) {
    return this.dashboardService.getOwnerDashboard(req.user.id);
  }

  // Occupancy Analytics 

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get('occupancy')
  @ApiOperation({
    summary: 'F-D02: Occupancy Analytics',
    description: 'Charts showing occupancy trends by branch over selectable periods.',
  })
  @ApiResponse({ status: 200, description: 'Occupancy trend data' })
  async getOccupancyAnalytics(@Request() req: any, @Query() query: OccupancyQueryDto) {
    return this.occupancyAnalyticsService.getOccupancyTrends(
      req.user.id,
      query.branchId,
      query.period || 'daily',
      query.startDate,
      query.endDate,
    );
  }

  // Revenue Reports

  @Roles(Role.HOTEL_OWNER)
  @Get('revenue')
  @ApiOperation({
    summary: 'F-D03: Revenue Reports',
    description: 'Revenue breakdown by branch, room type, food sales, date range. Net revenue after cancellations.',
  })
  @ApiResponse({ status: 200, description: 'Revenue report data' })
  async getRevenueReports(@Request() req: any, @Query() query: DateRangeQueryDto) {
    return this.revenueReportsService.getRevenueReport(
      req.user.id,
      query.branchId,
      query.startDate,
      query.endDate,
    );
  }

  // Booking List 

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK, Role.AGENT)
  @Get('bookings')
  @ApiOperation({
    summary: 'F-D04: Booking List',
    description: 'Sortable, filterable list of all bookings with pagination.',
  })
  @ApiResponse({ status: 200, description: 'Paginated booking list' })
  async getBookingList(@Request() req: any, @Query() query: BookingListQueryDto) {
    return this.bookingListService.getBookingList(
      req.user.id,
      {
        branchId: query.branchId,
        status: query.status,
        guestName: query.guestName,
        startDate: query.startDate,
        endDate: query.endDate,
      },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
      { page: parseInt(query.page || '1', 10), limit: parseInt(query.limit || '20', 10) },
    );
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FRONT_DESK, Role.AGENT)
  @Get('bookings/export')
  @ApiOperation({
    summary: 'F-D04: Export Bookings to CSV',
    description: 'Exports filtered booking list as a downloadable CSV file.',
  })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportBookings(@Request() req: any, @Query() query: BookingExportQueryDto, @Res() res: any) {
    const csv = await this.bookingListService.exportToCsv(req.user.id, {
      branchId: query.branchId,
      status: query.status,
      guestName: query.guestName,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const filename = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  // Today's Operations 

  @Roles(Role.BRANCH_MANAGER, Role.FRONT_DESK)
  @Get('today-operations/:branchId')
  @ApiOperation({
    summary: "F-D05: Today's Operations",
    description: 'Branch manager view: check-ins, check-outs, cleaning queue, food orders, occupancy.',
  })
  @ApiResponse({ status: 200, description: "Today's operations data" })
  async getTodayOperations(@Param('branchId') branchId: string) {
    return this.todayOperationsService.getTodayOperations(branchId);
  }

  // Property Owner Dashboard 

  @Roles(Role.PROPERTY_OWNER)
  @Get('property-owner')
  @ApiOperation({
    summary: 'F-D06: Property Owner Dashboard',
    description: 'Overview: listing performance, inquiries, bookings, offers, agent performance, earnings.',
  })
  @ApiResponse({ status: 200, description: 'Property owner dashboard data' })
  async getPropertyOwnerDashboard(@Request() req: any) {
    return this.propertyOwnerDashboardService.getPropertyOwnerDashboard(req.user.id);
  }

  // Agent Dashboard 

  @Roles(Role.AGENT)
  @Get('agent')
  @ApiOperation({
    summary: 'F-D07: Agent Dashboard',
    description: 'Folio summary, leads pipeline, scheduled viewings, commission earned/pending, recent activity.',
  })
  @ApiResponse({ status: 200, description: 'Agent dashboard data' })
  async getAgentDashboard(@Request() req: any) {
    return this.agentDashboardService.getAgentDashboard(req.user.id);
  }

  // Inventory Reports

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Get('inventory-reports')
  @ApiOperation({
    summary: 'F-D08: Inventory Reports',
    description: 'Stock levels, consumption trends, reorder recommendations, supplier spend analysis.',
  })
  @ApiResponse({ status: 200, description: 'Inventory report data' })
  async getInventoryReports(@Request() req: any, @Query() query: DateRangeQueryDto) {
    return this.inventoryReportsService.getInventoryReport(
      req.user.id,
      query.branchId,
      query.startDate,
      query.endDate,
    );
  }

  // F&B Analytics 

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.FOOD_SERVICE_MANAGER)
  @Get('fnb-analytics')
  @ApiOperation({
    summary: 'F-D09: F&B Analytics',
    description: 'Daily/weekly order counts, revenue by category, top-selling items, preparation time averages.',
  })
  @ApiResponse({ status: 200, description: 'F&B analytics data' })
  async getFnbAnalytics(@Request() req: any, @Query() query: DateRangeQueryDto) {
    return this.fnbAnalyticsService.getFnbAnalytics(
      req.user.id,
      query.branchId,
      query.startDate,
      query.endDate,
    );
  }
}
