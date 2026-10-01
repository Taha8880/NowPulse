import { Agent } from "agents";
const INITIAL_STATE={status:"idle",runningUntil:0,lastRun:null,lastResult:null,lastError:null,lastRepair:null,version:"1.0.0"};
export class NowPulseGuardian extends Agent {
  initialState=INITIAL_STATE;
  async beginRun(runId,ttlSeconds=900){const now=Date.now();if(this.state.runningUntil&&this.state.runningUntil>now)return {acquired:false,state:this.state};this.setState({...this.state,status:"running",runningUntil:now+ttlSeconds*1000,lastRun:now,lastError:null});return {acquired:true,state:this.state};}
  async finishRun(result){this.setState({...this.state,status:result?.status||"idle",runningUntil:0,lastResult:result?.result||null,lastRepair:result?.repair||this.state.lastRepair||null,lastError:result?.error||null});return this.state;}
  async recordRepair(repair){this.setState({...this.state,lastRepair:repair||null});return this.state;}
  async getStatus(){return this.state;}
}
