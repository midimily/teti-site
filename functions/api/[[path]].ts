import worker, {type Env} from '../../worker/index';

export const onRequest: PagesFunction<Env> = ({request, env}) => {
  return worker.fetch(request, env);
};
