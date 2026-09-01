export type TrainingService = {
  order: number;
  name: string;
  summary: string;
  description: string;
};

const serviceModules = import.meta.glob('../../content/services/*.json', {
  eager: true,
  import: 'default'
});

export const trainingServices = Object.values(serviceModules)
  .map(service => service as TrainingService)
  .sort((first, second) => first.order - second.order);
