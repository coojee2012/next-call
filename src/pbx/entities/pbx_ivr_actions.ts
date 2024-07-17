import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entiies/BaseEntity';

export type ActionPlaybackLogicArgs = {
  input?: boolean;
  doneGo?: string; // '200,1' 字符串表示的将要去向的IVR及其ordinal
  errorGo?: string; //  按键错误或输入超时
};

export type ActionPlaybackPbxArgs = {
  transfer_on_failure: string;
  digit_timeout: number;
  regexp: string;
  var_name: string;
  invalid_file: string;
  input_err_file: string;
  input_timeout_file: string;
  input_err_retry: number;
  input_timeout_retry: number;
  file_from_var: string;
  file: string;
  terminators: string;
  timeout: number;
  tries: number;
  max: number;
  min: number;
};

export type ActionPlaybackArgs = {
  pbx: ActionPlaybackPbxArgs;
  logic: ActionPlaybackLogicArgs;
};

@Entity('pbx_ivr_action')
@Index(["tenantId", "ivrNumber", "ordinal"], { unique: true })
export class PbxIvrActions extends BaseEntity {
  @Column()
  tenantId: number;
  @Column()
  ivrNumber: string;
  @Column()
  ordinal: number;
  @Column()
  actionType: number;
  @Column('simple-json')
  args: ActionPlaybackArgs;
  @Column({ default: '' })
  describe: string;
}
