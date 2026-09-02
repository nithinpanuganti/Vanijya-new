import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CropsModule } from './crops/crops.module';
import { MarketsModule } from './markets/markets.module';
import { PricesModule } from './prices/prices.module';
import { LotsModule } from './lots/lots.module';
import { BidsModule } from './bids/bids.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PaymentsModule } from './payments/payments.module';
import { DemoModule } from './demo/demo.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    NotificationsModule,
    UploadsModule,
    AuthModule,
    UsersModule,
    CropsModule,
    MarketsModule,
    PricesModule,
    LotsModule,
    BidsModule,
    TransactionsModule,
    PaymentsModule,
    DemoModule,
    AnalyticsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
