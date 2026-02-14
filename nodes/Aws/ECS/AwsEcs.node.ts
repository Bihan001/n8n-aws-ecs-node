import {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { awsApiRequest } from './GenericFunctions';

export class AwsEcs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AWS ECS',
		name: 'awsEcs',
		icon: 'file:ecs.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage AWS ECS resources',
		defaults: {
			name: 'AWS ECS',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'aws',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Force New Deployment',
						value: 'forceNewDeployment',
						description: 'Force a new deployment of a service',
						action: 'Force a new deployment',
					},
				],
				default: 'forceNewDeployment',
			},
			{
				displayName: 'Cluster Name or ID',
				name: 'clusterName',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getClusters',
				},
				displayOptions: {
					show: {
						operation: ['forceNewDeployment'],
					},
				},
				default: '',
				description:
					'The name of the cluster that hosts the service to update.  Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Service Name or ID',
				name: 'serviceName',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getServices',
					loadOptionsDependsOn: ['clusterName'],
				},
				displayOptions: {
					show: {
						operation: ['forceNewDeployment'],
					},
					hide: {
						clusterName: [''],
					},
				},
				required: true,
				default: '',
				description:
					'The name of the service to update.  Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Desired Count',
				name: 'desiredCount',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['forceNewDeployment'],
					},
				},
				default: -1,
				description:
					'The number of desired task instances for the service. Set to -1 (or leave as default) to keep the current desired count unchanged.',
			},
		],
	};

	methods = {
		loadOptions: {
			// Get all the available clusters to display them to user so that they can select them easily
			async getClusters(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const headers = {
					'Content-Type': 'application/x-amz-json-1.1',
					'X-Amz-Target': 'AmazonEC2ContainerServiceV20141113.ListClusters',
				};

				const responseData = await awsApiRequest.call(this, 'ecs', 'POST', '/', {}, headers);

				return responseData.clusterArns.map((clusterArn: string) => ({
					name: clusterArn,
					value: clusterArn,
				}));
			},
			// Get all the available services to display them to user so that they can select them easily
			async getServices(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				// get the cluster name from the parameters
				const clusterName = this.getNodeParameter('clusterName', 0) as string;

				if (!clusterName) {
					return [];
				}

				const headers = {
					'Content-Type': 'application/x-amz-json-1.1',
					'X-Amz-Target': 'AmazonEC2ContainerServiceV20141113.ListServices',
				};

				const body: { cluster: string; maxResults: number; nextToken?: string } = {
					// pass the cluster name to list the services
					cluster: clusterName,
					maxResults: 50,
				};

				const responseData = await awsApiRequest.call(this, 'ecs', 'POST', '/', body, headers);

				if (!responseData.serviceArns) {
					return [];
				}

				returnData.push(
					...responseData.serviceArns.map((serviceArn: string) => ({
						name: serviceArn,
						value: serviceArn,
					})),
				);

				if (responseData.nextToken) {
					let nextToken = responseData.nextToken;
					while (true) {
						body.nextToken = nextToken;
						const additionalData = await awsApiRequest.call(
							this,
							'ecs',
							'POST',
							'/',
							body,
							headers,
						);
						returnData.push(
							...additionalData.serviceArns.map((serviceArn: string) => ({
								name: serviceArn,
								value: serviceArn,
							})),
						);
						nextToken = additionalData.nextToken;

						if (!nextToken) {
							break;
						}
					}
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const cluster = this.getNodeParameter('clusterName', 0);
		const service = this.getNodeParameter('serviceName', 0);
		const desiredCount = this.getNodeParameter('desiredCount', 0) as number;

		const headers = {
			'Content-Type': 'application/x-amz-json-1.1',
			'X-Amz-Target': 'AmazonEC2ContainerServiceV20141113.UpdateService',
		};

		const body: { cluster: unknown; service: unknown; forceNewDeployment: boolean; desiredCount?: number } = {
			cluster: cluster,
			service: service,
			forceNewDeployment: true,
		};

		if (desiredCount >= 0) {
			body.desiredCount = desiredCount;
		}

		const responseData = await awsApiRequest.call(this, 'ecs', 'POST', '/', body, headers);

		if (responseData) {
			returnData.push({ json: responseData as IDataObject });
		}

		return [returnData as INodeExecutionData[]];
	}
}
