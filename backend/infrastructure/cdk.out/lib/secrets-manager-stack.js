"use strict";
/**
 * AWS Secrets Manager Stack
 *
 * Mux API認証情報を安全に保管
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsManagerStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
class SecretsManagerStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Mux API認証情報用のシークレット
        this.muxSecret = new secretsmanager.Secret(this, 'MuxSecret', {
            secretName: 'rork/mux-credentials',
            description: 'Mux API credentials for live streaming',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    accessTokenId: '',
                    secretKey: '',
                    webhookSecret: '',
                }),
                generateStringKey: 'placeholder',
            },
        });
        // 出力
        new cdk.CfnOutput(this, 'MuxSecretArn', {
            value: this.muxSecret.secretArn,
            description: 'ARN of Mux credentials secret',
            exportName: 'MuxSecretArn',
        });
        new cdk.CfnOutput(this, 'MuxSecretName', {
            value: this.muxSecret.secretName,
            description: 'Name of Mux credentials secret',
            exportName: 'MuxSecretName',
        });
    }
}
exports.SecretsManagerStack = SecretsManagerStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0cy1tYW5hZ2VyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3NlY3JldHMtbWFuYWdlci1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLCtFQUFpRTtBQUdqRSxNQUFhLG1CQUFvQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBR2hELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsc0JBQXNCO1FBQ3RCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDNUQsVUFBVSxFQUFFLHNCQUFzQjtZQUNsQyxXQUFXLEVBQUUsd0NBQXdDO1lBQ3JELG9CQUFvQixFQUFFO2dCQUNwQixvQkFBb0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNuQyxhQUFhLEVBQUUsRUFBRTtvQkFDakIsU0FBUyxFQUFFLEVBQUU7b0JBQ2IsYUFBYSxFQUFFLEVBQUU7aUJBQ2xCLENBQUM7Z0JBQ0YsaUJBQWlCLEVBQUUsYUFBYTthQUNqQztTQUNGLENBQUMsQ0FBQztRQUVILEtBQUs7UUFDTCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTO1lBQy9CLFdBQVcsRUFBRSwrQkFBK0I7WUFDNUMsVUFBVSxFQUFFLGNBQWM7U0FDM0IsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVTtZQUNoQyxXQUFXLEVBQUUsZ0NBQWdDO1lBQzdDLFVBQVUsRUFBRSxlQUFlO1NBQzVCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWpDRCxrREFpQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQVdTIFNlY3JldHMgTWFuYWdlciBTdGFja1xyXG4gKlxyXG4gKiBNdXggQVBJ6KqN6Ki85oOF5aCx44KS5a6J5YWo44Gr5L+d566hXHJcbiAqL1xyXG5cclxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlY3JldHNtYW5hZ2VyJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2VjcmV0c01hbmFnZXJTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgcHVibGljIHJlYWRvbmx5IG11eFNlY3JldDogc2VjcmV0c21hbmFnZXIuSVNlY3JldDtcclxuXHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy8gTXV4IEFQSeiqjeiovOaDheWgseeUqOOBruOCt+ODvOOCr+ODrOODg+ODiFxyXG4gICAgdGhpcy5tdXhTZWNyZXQgPSBuZXcgc2VjcmV0c21hbmFnZXIuU2VjcmV0KHRoaXMsICdNdXhTZWNyZXQnLCB7XHJcbiAgICAgIHNlY3JldE5hbWU6ICdyb3JrL211eC1jcmVkZW50aWFscycsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnTXV4IEFQSSBjcmVkZW50aWFscyBmb3IgbGl2ZSBzdHJlYW1pbmcnLFxyXG4gICAgICBnZW5lcmF0ZVNlY3JldFN0cmluZzoge1xyXG4gICAgICAgIHNlY3JldFN0cmluZ1RlbXBsYXRlOiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBhY2Nlc3NUb2tlbklkOiAnJyxcclxuICAgICAgICAgIHNlY3JldEtleTogJycsXHJcbiAgICAgICAgICB3ZWJob29rU2VjcmV0OiAnJyxcclxuICAgICAgICB9KSxcclxuICAgICAgICBnZW5lcmF0ZVN0cmluZ0tleTogJ3BsYWNlaG9sZGVyJyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIOWHuuWKm1xyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ011eFNlY3JldEFybicsIHtcclxuICAgICAgdmFsdWU6IHRoaXMubXV4U2VjcmV0LnNlY3JldEFybixcclxuICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgTXV4IGNyZWRlbnRpYWxzIHNlY3JldCcsXHJcbiAgICAgIGV4cG9ydE5hbWU6ICdNdXhTZWNyZXRBcm4nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ011eFNlY3JldE5hbWUnLCB7XHJcbiAgICAgIHZhbHVlOiB0aGlzLm11eFNlY3JldC5zZWNyZXROYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgTXV4IGNyZWRlbnRpYWxzIHNlY3JldCcsXHJcbiAgICAgIGV4cG9ydE5hbWU6ICdNdXhTZWNyZXROYW1lJyxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXX0=