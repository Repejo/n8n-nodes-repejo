import {
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeOperationError,
} from "n8n-workflow";

import { createHmac, timingSafeEqual } from "crypto";
import { EventType, WebhookPayload } from "../types";

export class RepejoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Repejo Trigger",
		name: "repejoTrigger",
		icon: "file:repejo.svg",
		group: ["trigger"],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: "Starts the workflow when Repejo sends webhooks",
		defaults: {
			name: "Repejo Trigger",
		},
		inputs: [],
		outputs: ["main"],
		webhooks: [
			{
				name: "default",
				httpMethod: "POST",
				responseMode: "onReceived",
				path: "webhook",
			},
		],
		properties: [
			{
				displayName: "Events",
				name: "events",
				type: "multiOptions",
				options: [
					{
						name: "Payer Created",
						value: "payer.created",
						description: "Triggers when a new payer (donor) is created",
					},
					{
						name: "Payer Updated",
						value: "payer.updated",
						description: "Triggers when a payer is updated",
					},
					{
						name: "Receivable Created",
						value: "receivable.created",
						description: "Triggers when a new receivable (payment) is created",
					},
					{
						name: "Receivable Updated",
						value: "receivable.updated",
						description: "Triggers when a receivable is updated",
					},
					{
						name: "Subscription Created",
						value: "subscription.created",
						description: "Triggers when a new recurring donation is created",
					},
					{
						name: "Subscription Updated",
						value: "subscription.updated",
						description: "Triggers when a subscription is updated",
					},
				],
				default: [],
				required: true,
				description: "The events to listen for",
			},
			{
				displayName: "Webhook Secret",
				name: "webhookSecret",
				type: "string",
				typeOptions: {
					password: true,
				},
				default: "",
				description:
					"The secret key used to validate webhook signatures (HMAC-SHA256)",
				placeholder: "Enter your webhook secret from Repejo",
			},
			{
				displayName: "Validate Signature",
				name: "validateSignature",
				type: "boolean",
				default: true,
				description:
					"Whether to validate the webhook signature. Recommended for security.",
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as unknown as WebhookPayload;
		const events = this.getNodeParameter("events") as EventType[];
		const webhookSecret = this.getNodeParameter("webhookSecret") as string;
		const validateSignature = this.getNodeParameter(
			"validateSignature",
		) as boolean;

		// Validate signature if enabled
		if (validateSignature && webhookSecret) {
			const signature = this.getHeaderData()["repejo-signature"] as string;
			if (!signature) {
				throw new NodeOperationError(
					this.getNode(),
					"Missing Repejo-Signature header",
				);
			}

			// Try to get the raw body for HMAC verification
			const req = this.getRequestObject();
			let rawBody: string;

			// Check if we can access the raw body
			if (req.rawBody) {
				rawBody = req.rawBody;
			} else if (req.body && typeof req.body === "string") {
				rawBody = req.body;
			} else {
				// Fallback: reconstruct from parsed JSON (not ideal but better than failing)
				rawBody = JSON.stringify(bodyData);
			}

			const expectedSignature = createHmac("sha256", webhookSecret)
				.update(rawBody, "utf8")
				.digest("hex");

			const signatureHex = signature
				.trim()
				.toLowerCase()
				.replace(/^sha256=/, "");
			const signatureBuffer = Buffer.from(signatureHex, "hex");
			const expectedBuffer = Buffer.from(expectedSignature, "hex");

			if (
				signatureBuffer.length !== expectedBuffer.length ||
				!timingSafeEqual(signatureBuffer, expectedBuffer)
			) {
				throw new NodeOperationError(
					this.getNode(),
					"Invalid webhook signature",
				);
			}
		}

		// Validate timestamp to prevent replay attacks (5 minutes)
		const sentAt = new Date(bodyData.sent_at);
		const now = new Date();
		const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds

		if (now.getTime() - sentAt.getTime() > maxAge) {
			throw new NodeOperationError(
				this.getNode(),
				"Webhook is too old (replay attack protection)",
			);
		}

		// Filter events if specified
		if (events.length > 0 && !events.includes(bodyData.event_type)) {
			// Return empty response for filtered events
			return {
				workflowData: [[]],
			};
		}

		// Return the webhook data
		return {
			workflowData: [
				[
					{
						json: {
							event_type: bodyData.event_type,
							sent_at: bodyData.sent_at,
							data: bodyData.data,
							// Add some convenience fields
							entity_type: bodyData.event_type.split(".")[0],
							action: bodyData.event_type.split(".")[1],
						},
					},
				],
			],
		};
	}
}
