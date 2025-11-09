/**
 * AWS Secrets Manager Stack
 *
 * Mux API認証情報を安全に保管
 */

import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class SecretsManagerStack extends cdk.Stack {
  public readonly muxSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 既存のMux API認証情報シークレットをインポート
    this.muxSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'MuxSecret',
      'rork/mux-credentials'
    );

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
